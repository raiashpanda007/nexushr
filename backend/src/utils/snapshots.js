export const buildDeptSnapshot = (dept) => {
  if (!dept) return null;
  return {
    _id: dept._id,
    name: dept.name,
  };
};

export const buildUserSnapshot = (user, deptSnapshot) => {
  if (!user) return null;
  const dept = deptSnapshot || user.deptSnapshot || null;
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    profilePhoto: user.profilePhoto ?? null,
    deptId: dept?._id ?? user.deptId ?? null,
    deptName: dept?.name ?? null,
  };
};

export const buildSkillNameMap = (skills) => {
  const map = new Map();
  (skills || []).forEach((skill) => {
    if (skill?._id) {
      map.set(String(skill._id), skill.name);
    }
  });
  return map;
};

export const applySkillSnapshots = (skills, skillNameMap) =>
  (skills || []).map((skill) => ({
    ...skill,
    skillName: skillNameMap.get(String(skill.skillId)) || skill.skillName || "",
  }));

export const buildLeaveTypeSnapshot = (leaveType) => {
  if (!leaveType) return null;
  return {
    _id: leaveType._id,
    name: leaveType.name,
    code: leaveType.code,
    length: leaveType.length,
    isPaid: leaveType.isPaid,
  };
};

export const buildSalarySnapshot = (salary) => {
  if (!salary) return null;
  return {
    _id: salary._id,
    base: salary.base,
    hra: salary.hra,
    lta: salary.lta,
  };
};

export const buildHiringManagerSnapshot = (user) => {
  if (!user) return null;
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
};

export const buildOpeningSnapshot = (opening) => {
  if (!opening) return null;
  return {
    _id: opening._id,
    title: opening.title,
    departmentId: opening.departmentId ?? opening.departmentSnapshot?._id ?? null,
    departmentName: opening.departmentSnapshot?.name ?? null,
    hiringManagerId: opening.HiringManager ?? opening.hiringManagerSnapshot?._id ?? null,
    hiringManagerName: opening.hiringManagerSnapshot
      ? `${opening.hiringManagerSnapshot.firstName ?? ""} ${opening.hiringManagerSnapshot.lastName ?? ""}`.trim()
      : null,
    hiringManagerEmail: opening.hiringManagerSnapshot?.email ?? null,
  };
};

export const buildRoundSnapshot = (round, rank) => {
  if (!round) return null;
  return {
    _id: round._id,
    name: round.name,
    description: round.description,
    type: round.type,
    rank: rank ?? null,
  };
};
