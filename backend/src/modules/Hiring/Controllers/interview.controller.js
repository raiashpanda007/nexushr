import mongoose from "mongoose";
import { AsyncHandler, ApiError, ApiResponse } from "../../../utils/index.js";
import InterviewModel from "../Models/interview.model.js";
import OpeningsModel from "../Models/openings.model.js";
import ApplicantsModel from "../Models/applicants.model.js";
import RoundsModel from "../Models/rounds.model.js";
import EventModal from "../../Events/Models/Events.models.js";
import UsersModel from "../../Users/models/users.models.js";
import Types from "../../../types/index.js";

class InterviewController {
  constructor() {
    this.repo = InterviewModel;
    this.openingsModel = OpeningsModel;
    this.applicantsModel = ApplicantsModel;
    this.usersModel = UsersModel;
    this.roundsModel = RoundsModel;
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
    const opening = await this.openingsModel.findOne({ rounds: roundId });
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
    const eventDescription =
      `Interview scheduled for applicant ${applicant.name} applying for the position of "${opening.title}".\n\n` +
      `Round   : ${round.name} (${round.type})\n` +
      `Date    : ${interviewDate.toDateString()}\n` +
      `Time    : ${timeString}\n` +
      `Reviewers: ${reviewerNames}\n` +
      `Hiring Manager: ${hiringManager.name}\n\n` +
      (feedback ? `Notes: ${feedback}` : "");

    // Deduplicated participant list (reviewers + hiring manager)
    const participantIds = [
      ...new Set([...reviewers, opening.HiringManager.toString()]),
    ];

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
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

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
        rounds: interview.roundId,
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

      if (!interview) {
        throw new ApiError(
          404,
          "Interview not found for the given round and applicant",
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

    const opening = await this.openingsModel.findOne({ rounds: interview.roundId });
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
        const roundIndex = opening.rounds.findIndex(
          (round) => round.toString() === interview.roundId.toString(),
        );

        if (roundIndex !== -1) {
          if (roundIndex === opening.rounds.length - 1) {
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
                currentRound: opening.rounds[roundIndex + 1],
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
      o.rounds.map((r) => r.toString()),
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
          .findOne({ rounds: interview.roundId })
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
