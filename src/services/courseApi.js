const API_URL = `${API_URL}/api/courses`;

export async function getAllCourses() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Failed to fetch courses");
  return res.json();
}

export async function addCourse(course) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(course),
  });
  if (!res.ok) throw new Error("Failed to add course");
  return res.json();
}

export async function deleteCourse(id) {
  const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete course");
  return res.json();
}

export async function getCourseById(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch course");
  return res.json();
}

export async function updateCourse(id, updatedCourse) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedCourse),
  });
  if (!res.ok) throw new Error("Failed to update course");
  return res.json();
}
