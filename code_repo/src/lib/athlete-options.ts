/** Option lists shared by signup and the /apply form. */

export const SPORTS = [
  "Basketball", "Football", "Soccer", "Volleyball", "Baseball", "Softball",
  "Track & Field", "Swimming", "Tennis", "Wrestling", "Lacrosse", "Hockey",
  "Cross Country", "Golf", "Gymnastics", "Other",
];

export const PLAYER_GRADES = ["6th", "7th", "8th", "9th", "10th", "11th", "12th", "College"];

/** Grades young enough that we need a parent's contact at signup. */
export const MIDDLE_SCHOOL_GRADES = new Set(["6th", "7th", "8th"]);
