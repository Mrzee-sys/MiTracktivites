import { Student } from '../models/Student.js';
import { Session } from '../models/Session.js';
import { createCrudController } from '../utils/createCrudController.js';

export const {
  list: getStudents,
  getById: getStudentById,
  create: createStudent,
  update: updateStudent,
  remove: deleteStudent,
} = createCrudController(Student, {
  sort: { name: 1 },
  buildFilter: ({ grade }) => (typeof grade === 'string' ? { grade } : {}),
  // Remove the deleted student from any session attendance lists
  afterDelete: (student) =>
    Session.updateMany({ attendance: student._id }, { $pull: { attendance: student._id } }),
});

