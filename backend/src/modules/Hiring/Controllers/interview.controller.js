import mongoose from "mongoose";
import { AsyncHandler, ApiError, ApiResponse } from "../../../utils/index.js";
import InterviewModel from "../Models/interview.model.js";
import OpeningsModel from "../Models/openings.model.js";
import ApplicantsModel from "../Models/applicants.model.js";
import RoundsModel from "../Models/rounds.model.js";
import EventModal from "../../Events/Models/Events.models.js";
import UsersModel from "../../Users/models/users.models.js";
import Types from "../../../types/index.js";
import ZoomService from "../../../utils/Zoom.js";
import { SendMailEvent } from "../../../queue/mails.queue.js";

class InterviewController {
  constructor() {
    this.repo = InterviewModel;
    this.openingsModel = OpeningsModel;
    this.applicantsModel = ApplicantsModel;
    this.usersModel = UsersModel;
    this.roundsModel = RoundsModel;
    this.zoomService = new ZoomService();
  }

  Create = AsyncHandler(async (req, res) => {
    const parsedBody = Types.Interviews.Create.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(400, "Invalid interview data");
    }

    const {
      applicantId,
      roundId,
      reviewers,
      reviewDate,
      status,
      feedback,
      grades,
      result,
    } = parsedBody.data;

    // Fetch applicant and round in parallel
    const [applicant, round] = await Promise.all([
      this.applicantsModel.findById(applicantId),
      this.roundsModel.findById(roundId),
    ]);
    if (!applicant) throw new ApiError(404, "Applicant not found");
    if (!round) throw new ApiError(404, "Round not found");

    // Round has no openingId — find the opening that owns this round
    const opening = await this.openingsModel.findOne({ "rounds.round": roundId });
    if (!opening) throw new ApiError(404, "Opening not found");

    // Validate all reviewers exist and belong to the opening's department
    const reviewerDocs = await this.usersModel.find({
      _id: { $in: reviewers },
    });
    if (reviewerDocs.length !== reviewers.length) {
      throw new ApiError(404, "One or more reviewers not found");
    }

    const hiringManager = await this.usersModel.findById(opening.HiringManager);
    if (!hiringManager) throw new ApiError(404, "Hiring Manager not found");

    // Build event details
    const interviewDate = new Date(reviewDate);
    const timeString = interviewDate.toTimeString().slice(0, 5); // "HH:MM"
    const reviewerNames = reviewerDocs.map((r) => r.name).join(", ");

    // Deduplicated participant list (reviewers + hiring manager)
    const participantIds = [
      ...new Set([...reviewers, opening.HiringManager.toString()]),
    ];

    // Create Zoom meeting (non-blocking: continue even if Zoom is unavailable)
    let zoomData = null;
    try {
      zoomData = await this.zoomService.CreateMeeting(
        `Interview — ${applicant.name} · ${opening.title}`,
        interviewDate,
      );
    } catch (zoomError) {
      console.error("Zoom meeting creation failed:", zoomError.message);
    }

    const eventDescription =
      `Interview scheduled for applicant ${applicant.name} applying for the position of "${opening.title}".\n\n` +
      `Round   : ${round.name} (${round.type})\n` +
      `Date    : ${interviewDate.toDateString()}\n` +
      `Time    : ${timeString}\n` +
      `Reviewers: ${reviewerNames}\n` +
      `Hiring Manager: ${hiringManager.name}\n` +
      (zoomData ? `Zoom Link: ${zoomData.joinUrl}\n` : "") +
      (feedback ? `\nNotes: ${feedback}` : "");

    // ── Transaction ──────────────────────────────────────────────────────────
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const [interview] = await this.repo.create(
        [
          {
            applicantId,
            roundId,
            reviewers,
            reviewDate: interviewDate,
            status: status || "SCHEDULED",
            feedback,
            grades,
            result: result || "PENDING",
            ...(zoomData && {
              zoomMeetingId: String(zoomData.meetingId),
              zoomJoinUrl: zoomData.joinUrl,
            }),
          },
        ],
        { session },
      );
      const applicantUpdate = {
        status: "INTERVIEWING",
        currentRound: roundId,
      };
      await this.applicantsModel.findByIdAndUpdate(applicantId, applicantUpdate, {
        session,
      });
      const [event] = await EventModal.create(
        [
          {
            name: `Interview — ${applicant.name} · ${opening.title}`,
            description: eventDescription,
            date: interviewDate,
            time: timeString,
            respectedToDepartments: [opening.departmentId],
            resepectedEmplooyees: participantIds,
            type: "MEETING",
            forAll: false,
            interviewId: interview._id,
            ...(zoomData && { meetLink: zoomData.joinUrl }),
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      // ── Email notifications (fire-and-forget) ─────────────────────────────
      const formattedDate = interviewDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Applicant: interview scheduled
      SendMailEvent({
        to: applicant.email,
        subject: `Interview Scheduled: ${opening.title} — ${formattedDate}`,
        text: [
          `Dear ${applicant.name},`,
          ``,
          `Your interview for the position of "${opening.title}" has been scheduled.`,
          ``,
          `  Round    : ${round.name} (${round.type})`,
          `  Date     : ${formattedDate}`,
          `  Time     : ${timeString}`,
          zoomData ? `  Zoom     : ${zoomData.joinUrl}` : null,
          ``,
          `Please join the meeting a few minutes before the scheduled time. Best of luck!`,
          ``,
          `Regards,`,
          `HR Team`,
        ]
          .filter(Boolean)
          .join("\n"),
        html: `<!DOCTYPE html><html lang="en"><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;"><div style="max-width:600px;margin:30px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);"><div style="background:#1a73e8;padding:32px;"><h1 style="margin:0;color:#fff;font-size:22px;">Interview Scheduled</h1></div><div style="padding:32px;"><p style="margin-top:0;font-size:15px;">Dear <strong>${applicant.name}</strong>,</p><p style="font-size:15px;line-height:1.6;">Your interview for the position of <strong>${opening.title}</strong> has been scheduled.</p><table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;"><tr style="background:#f1f3f4;"><td style="padding:12px 16px;font-weight:600;color:#555;width:130px;">Round</td><td style="padding:12px 16px;">${round.name} &nbsp;·&nbsp; <span style="color:#777;">${round.type}</span></td></tr><tr><td style="padding:12px 16px;font-weight:600;color:#555;">Date</td><td style="padding:12px 16px;">${formattedDate}</td></tr><tr style="background:#f1f3f4;"><td style="padding:12px 16px;font-weight:600;color:#555;">Time</td><td style="padding:12px 16px;">${timeString}</td></tr>${zoomData ? `<tr><td style="padding:12px 16px;font-weight:600;color:#555;">Zoom Link</td><td style="padding:12px 16px;"><a href="${zoomData.joinUrl}" style="color:#1a73e8;word-break:break-all;">${zoomData.joinUrl}</a></td></tr>` : ""}</table><p style="font-size:14px;color:#555;">Please join a few minutes early and ensure a stable internet connection.</p><p style="font-size:14px;margin-bottom:0;">Best of luck!<br/><strong>HR Team</strong></p></div><div style="background:#f1f3f4;padding:16px 32px;font-size:12px;color:#999;text-align:center;">This is an automated message. Please do not reply.</div></div></body></html>`,
      }).catch((e) => console.error("Applicant interview mail failed:", e.message));

      // Reviewers & Hiring Manager: interview assignment
      const hmIdStr = hiringManager._id.toString();
      const reviewerIdSet = new Set(reviewerDocs.map((r) => r._id.toString()));
      const allInterviewers = [
        ...reviewerDocs,
        ...(reviewerIdSet.has(hmIdStr) ? [] : [hiringManager]),
      ];

      allInterviewers.forEach((person) => {
        const isHM = person._id.toString() === hmIdStr;
        const personRole = isHM ? "Hiring Manager" : "Interviewer";
        const coReviewers = reviewerDocs
          .filter((r) => r._id.toString() !== person._id.toString())
          .map((r) => r.name)
          .join(", ");
        SendMailEvent({
          to: person.email,
          subject: `Interview Assignment: ${applicant.name} for ${opening.title} — ${formattedDate}`,
          text: [
            `Dear ${person.name},`,
            ``,
            `You have been assigned as ${isHM ? "the Hiring Manager" : "an Interviewer"} for the following interview.`,
            ``,
            `  Applicant    : ${applicant.name} (${applicant.email})`,
            `  Position     : ${opening.title}`,
            `  Round        : ${round.name} (${round.type})`,
            `  Date         : ${formattedDate}`,
            `  Time         : ${timeString}`,
            coReviewers ? `  Co-Reviewers : ${coReviewers}` : null,
            zoomData ? `  Zoom         : ${zoomData.joinUrl}` : null,
            ``,
            `Please review the applicant's profile before the interview and be ready at the scheduled time.`,
            ``,
            `Regards,`,
            `HR Team`,
          ]
            .filter(Boolean)
            .join("\n"),
          html: `<!DOCTYPE html><html lang="en"><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;"><div style="max-width:600px;margin:30px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);"><div style="background:#0d6e3f;padding:32px;"><h1 style="margin:0;color:#fff;font-size:22px;">Interview Assignment</h1><p style="margin:6px 0 0;color:#a8d5b5;font-size:14px;">${personRole}</p></div><div style="padding:32px;"><p style="margin-top:0;font-size:15px;">Dear <strong>${person.name}</strong>,</p><p style="font-size:15px;line-height:1.6;">You have been assigned as <strong>${isHM ? "the Hiring Manager" : "an Interviewer"}</strong> for the following interview.</p><table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;"><tr style="background:#f1f3f4;"><td style="padding:12px 16px;font-weight:600;color:#555;width:140px;">Applicant</td><td style="padding:12px 16px;">${applicant.name} <span style="color:#999;font-size:13px;">(${applicant.email})</span></td></tr><tr><td style="padding:12px 16px;font-weight:600;color:#555;">Position</td><td style="padding:12px 16px;">${opening.title}</td></tr><tr style="background:#f1f3f4;"><td style="padding:12px 16px;font-weight:600;color:#555;">Round</td><td style="padding:12px 16px;">${round.name} &nbsp;·&nbsp; <span style="color:#777;">${round.type}</span></td></tr><tr><td style="padding:12px 16px;font-weight:600;color:#555;">Date</td><td style="padding:12px 16px;">${formattedDate}</td></tr><tr style="background:#f1f3f4;"><td style="padding:12px 16px;font-weight:600;color:#555;">Time</td><td style="padding:12px 16px;">${timeString}</td></tr>${coReviewers ? `<tr><td style="padding:12px 16px;font-weight:600;color:#555;">Co-Reviewers</td><td style="padding:12px 16px;">${coReviewers}</td></tr>` : ""}${zoomData ? `<tr style="background:#f1f3f4;"><td style="padding:12px 16px;font-weight:600;color:#555;">Zoom Link</td><td style="padding:12px 16px;"><a href="${zoomData.joinUrl}" style="color:#0d6e3f;word-break:break-all;">${zoomData.joinUrl}</a></td></tr>` : ""}</table><p style="font-size:14px;color:#555;">Please review the applicant's profile before the interview and be ready at the scheduled time.</p><p style="font-size:14px;margin-bottom:0;">Regards,<br/><strong>HR Team</strong></p></div><div style="background:#f1f3f4;padding:16px 32px;font-size:12px;color:#999;text-align:center;">This is an automated message. Please do not reply.</div></div></body></html>`,
        }).catch((e) =>
          console.error(`${personRole} interview mail failed:`, e.message),
        );
      });

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            { interview, event },
            "Interview scheduled and event created successfully",
          ),
        );
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  });

  Get = AsyncHandler(async (req, res) => {
    const interviewId = req.params.id;

    if (interviewId) {
      if (!mongoose.Types.ObjectId.isValid(interviewId)) {
        throw new ApiError(400, "Invalid interview ID");
      }

      const interview = await this.repo
        .findById(interviewId)
        .populate({
          path: "applicantId",
          select: "name email",
        })
        .populate({
          path: "reviewers",
          select: "name email",
        });

      if (!interview) {
        throw new ApiError(404, "Interview not found");
      }

      const opening = await this.openingsModel.findOne({
        "rounds.round": interview.roundId,
      });
      if (!opening) {
        throw new ApiError(404, "Associated opening not found");
      }

      if (
        !interview.reviewers.includes(req.user.id) ||
        opening.HiringManager.toString() !== req.user.id ||
        req.user.role != "HR"
      ) {
        throw new ApiError(
          403,
          "You do not have permission to view this interview",
        );
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { interview },
            "Interview retrieved successfully",
          ),
        );
    } else {
      const roundId = req.query.roundId;
      const applicantId = req.query.applicantId;
      if (!applicantId) {
        throw new ApiError(400, "applicantId query parameter is required");
      }
      if (!roundId) {
        const interviews = await this.repo
          .find({ applicantId: applicantId })
          .populate({
            path: "applicantId",
            select: "name email",
          })
          .populate({
            path: "reviewers",
            select: "name email",
          })
          .populate({
            path: "roundId",
            select: "name",
          })
          .populate({
            path: "openingId",
            select: "title",
          });
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              { interviews },
              "Interviews retrieved successfully",
            ),
          );
      }

      const interview = await this.repo
        .findOne({
          roundId,
          applicantId,
        })
        .populate({
          path: "applicantId",
          select: "name email",
        })
        .populate({
          path: "reviewers",
          select: "name email",
        });


      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { interview },
            "Interview retrieved successfully",
          ),
        );
    }
  });

  Update = AsyncHandler(async (req, res) => {
    const interviewId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new ApiError(400, "Invalid interview ID");
    }

    const parsedBody = Types.Interviews.Update.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(400, "Invalid update data");
    }

    const interview = await this.repo.findById(interviewId).populate("reviewers", "_id");
    if (!interview) throw new ApiError(404, "Interview not found");

    const opening = await this.openingsModel.findOne({ "rounds.round": interview.roundId });
    if (!opening) throw new ApiError(404, "Opening not found");

    // Only reviewers, hiring manager, or HR may update
    const isReviewer = interview.reviewers.some(
      (r) => r._id.toString() === req.user.id,
    );
    const isHiringManager = opening.HiringManager.toString() === req.user.id;
    const isHR = req.user.role === "HR";

    if (!isReviewer && !isHiringManager && !isHR) {
      throw new ApiError(403, "You do not have permission to update this interview");
    }

    const { reviewers, reviewDate, feedback, grades, result } = parsedBody.data;

    if (reviewers) {
      const reviewerDocs = await this.usersModel.find({ _id: { $in: reviewers } });
      if (reviewerDocs.length !== reviewers.length) {
        throw new ApiError(404, "One or more reviewers not found");
      }
    }

    // ── Transaction ──────────────────────────────────────────────────────────
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Update interview fields
      if (reviewers) interview.reviewers = reviewers;
      if (reviewDate !== undefined) interview.reviewDate = new Date(reviewDate);
      if (feedback !== undefined) interview.feedback = feedback;
      if (grades !== undefined) interview.grades = grades;
      if (result !== undefined) {
        interview.result = result;
        // Auto-derive status from result
        if (result === "PASSED" || result === "FAILED") {
          interview.status = "COMPLETED";
        }
      }

      // Save interview within transaction
      await interview.save({ session });

      // Update applicant status based on interview result
      if (result === "FAILED") {
        await this.applicantsModel.findByIdAndUpdate(
          interview.applicantId,
          { status: "REJECTED" },
          { session },
        );
      }

      if (result === "PASSED") {
        const sortedRounds = [...opening.rounds].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
        const roundIndex = sortedRounds.findIndex(
          (r) => r.round.toString() === interview.roundId.toString(),
        );

        if (roundIndex !== -1) {
          if (roundIndex === sortedRounds.length - 1) {
            // Last round passed - move to offering
            await this.applicantsModel.findByIdAndUpdate(
              interview.applicantId,
              { status: "OFFERING" },
              { session },
            );
          } else {
            // Move applicant to next round
            await this.applicantsModel.findByIdAndUpdate(
              interview.applicantId,
              {
                currentRound: sortedRounds[roundIndex + 1].round,
                status: "INTERVIEWING",
              },
              { session },
            );
          }
        }
      }

      // Sync the linked event if date or reviewers changed
      if (reviewDate !== undefined || reviewers !== undefined) {
        const linkedEvent = await EventModal.findOne(
          { interviewId: interviewId },
        ).session(session);

        if (linkedEvent) {
          if (reviewDate !== undefined) {
            const updatedDate = new Date(reviewDate);
            linkedEvent.date = updatedDate;
            linkedEvent.time = updatedDate.toTimeString().slice(0, 5);
          }
          if (reviewers !== undefined) {
            const managerIdStr = opening.HiringManager.toString();
            linkedEvent.resepectedEmplooyees = [
              ...new Set([...reviewers, managerIdStr]),
            ];
          }
          await linkedEvent.save({ session });
        }
      }

      // Sync the Zoom meeting if reviewDate changed
      if (reviewDate !== undefined && interview.zoomMeetingId) {
        try {
          await this.zoomService.UpdateMeeting(interview.zoomMeetingId, {
            startTime: new Date(reviewDate),
          });
        } catch (zoomError) {
          console.error("Zoom meeting update failed:", zoomError.message);
        }
      }

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

    const updated = await this.repo
      .findById(interviewId)
      .populate({ path: "applicantId", select: "name email" })
      .populate({ path: "reviewers", select: "firstName lastName email" });

    return res
      .status(200)
      .json(new ApiResponse(200, { interview: updated }, "Interview updated successfully"));
  });

  GetMyInterviews = AsyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Find openings where this user is the hiring manager (to get their round IDs)
    const myOpenings = await this.openingsModel
      .find({ HiringManager: userId })
      .select("rounds title departmentId HiringManager");
    const managerRoundIds = myOpenings.flatMap((o) =>
      o.rounds.map((r) => r.round.toString()),
    );

    // Find all interviews where user is a reviewer OR manages the opening's round
    const interviews = await this.repo
      .find({
        $or: [
          { reviewers: userId },
          ...(managerRoundIds.length ? [{ roundId: { $in: managerRoundIds } }] : []),
        ],
      })
      .populate({ path: "applicantId", select: "name email" })
      .populate({ path: "reviewers", select: "firstName lastName email" })
      .populate({ path: "roundId", select: "name type" })
      .sort({ reviewDate: 1 });

    // Attach opening info to each interview
    const enriched = await Promise.all(
      interviews.map(async (interview) => {
        const opening = await this.openingsModel
          .findOne({ "rounds.round": interview.roundId })
          .select("title departmentId HiringManager")
          .populate("departmentId", "name")
          .populate("HiringManager", "firstName lastName email");
        return { ...interview.toObject(), opening: opening ?? null };
      }),
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { interviews: enriched },
          "My interviews retrieved successfully",
        ),
      );
  });
}

export default InterviewController;
