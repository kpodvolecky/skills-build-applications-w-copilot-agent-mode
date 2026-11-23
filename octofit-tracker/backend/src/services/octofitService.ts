import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity data is required'), { status: 400 });
  }

  const value = input as { userId?: unknown; teamId?: unknown; type?: unknown; minutes?: unknown };
  if (typeof value.userId !== 'string' || typeof value.teamId !== 'string') {
    throw Object.assign(new Error('A valid userId and teamId are required'), { status: 400 });
  }
  if (!mongoose.isValidObjectId(value.userId) || !mongoose.isValidObjectId(value.teamId)) {
    throw Object.assign(new Error('Activity references must be valid IDs'), { status: 400 });
  }
  if (typeof value.type !== 'string' || value.type.trim() === '') {
    throw Object.assign(new Error('Activity type is required'), { status: 400 });
  }
  if (typeof value.minutes !== 'number' || !Number.isFinite(value.minutes) || value.minutes < 1) {
    throw Object.assign(new Error('Minutes must be a positive number'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(value.userId).select('_id'),
    Team.findById(value.teamId).select('_id'),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('User or team does not exist'), { status: 404 });
  }

  const minutes = value.minutes;
  return Activity.create({
    user: user._id,
    team: team._id,
    type: value.type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team data is required'), { status: 400 });
  }
  const value = input as { name?: unknown; mascot?: unknown; members?: unknown };
  if (typeof value.name !== 'string' || value.name.trim() === '') {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }
  if (typeof value.mascot !== 'string' || value.mascot.trim() === '') {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }

  const members: mongoose.Types.ObjectId[] = [];
  if (Array.isArray(value.members)) {
    for (const memberId of value.members) {
      if (typeof memberId !== 'string' || !mongoose.isValidObjectId(memberId)) {
        throw Object.assign(new Error('Team members must be valid IDs'), { status: 400 });
      }
      if (await User.exists({ _id: memberId })) members.push(new mongoose.Types.ObjectId(memberId));
    }
  }

  return Team.create({ name: value.name.trim(), mascot: value.mascot.trim(), members });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const teams = await Team.find({
    _id: { $in: totals.map((entry) => entry._id) },
  }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals
    .map((entry) => ({
      teamName: teamNames.get(entry._id.toString()) ?? 'Unknown team',
      totalPoints: entry.totalPoints,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const recentActivity = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(1).lean();
  const latestType = recentActivity[0]?.type?.toLowerCase();
  const goal = user.fitnessGoal?.toLowerCase();
  const typeFocus = latestType === 'strength' ? 'strength'
    : latestType === 'run' || latestType === 'cycle' || latestType === 'walk' ? 'endurance'
    : undefined;
  const targetFocus = goal || typeFocus;

  const workouts = await Workout.find().lean();
  const matching = workouts.find((workout) => workout.focus?.toLowerCase() === targetFocus?.toLowerCase())
    ?? workouts.find((workout) => workout.focus?.toLowerCase() === typeFocus?.toLowerCase())
    ?? workouts[0];
  if (!matching) return [];

  const reasonParts = [];
  if (latestType) reasonParts.push(`recent ${latestType} activity`);
  if (goal) reasonParts.push(`your ${goal} goal`);
  const reason = reasonParts.length
    ? `Recommended for ${reasonParts.join(' and ')}.`
    : 'Recommended based on your activity pattern.';

  return [{ ...matching, reason }];
}

export { User };
