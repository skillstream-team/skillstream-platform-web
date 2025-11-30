import { Course, Lesson, Progress } from '../types';
import { getProgress, getCourseByIdWithLanguage } from '../services/api';

/**
 * Finds the next uncompleted lesson in a course
 * @param courseId - The course ID
 * @returns The next uncompleted lesson ID, or null if all lessons are completed or course not found
 */
export async function findNextUncompletedLesson(courseId: string | number): Promise<string | null> {
  try {
    // Get course with lessons
    const course = await getCourseByIdWithLanguage(Number(courseId));
    if (!course || !course.lessons || course.lessons.length === 0) {
      return null;
    }

    // Get progress
    const progress = await getProgress(String(courseId));
    
    // If no progress, return first lesson
    if (!progress || progress.completedLessons === 0) {
      return course.lessons[0]?.id || null;
    }

    // If all lessons completed, return null
    if (progress.completedLessons >= progress.totalLessons) {
      return null;
    }

    // Return the lesson at the index of completedLessons (next uncompleted)
    const nextLessonIndex = progress.completedLessons;
    if (nextLessonIndex < course.lessons.length) {
      return course.lessons[nextLessonIndex].id;
    }

    return null;
  } catch (error) {
    console.error('Error finding next uncompleted lesson:', error);
    return null;
  }
}

/**
 * Gets the continue learning URL for a course
 * @param courseId - The course ID
 * @returns The URL to continue learning, or course detail page if no progress
 */
export async function getContinueLearningUrl(courseId: string | number): Promise<string> {
  const nextLessonId = await findNextUncompletedLesson(courseId);
  if (nextLessonId) {
    return `/courses/${courseId}/learn/${nextLessonId}`;
  }
  return `/courses/${courseId}`;
}

/**
 * Checks if a course has progress
 * @param courseId - The course ID
 * @returns True if course has progress, false otherwise
 */
export async function hasCourseProgress(courseId: string | number): Promise<boolean> {
  try {
    const progress = await getProgress(String(courseId));
    return progress !== null && progress.completedLessons > 0;
  } catch (error) {
    return false;
  }
}

