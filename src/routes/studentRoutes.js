import { Router } from 'express';
import {
  createStudent,
  deleteStudent,
  getStudentById,
  getStudents,
  updateStudent,
} from '../controllers/studentController.js';

const router = Router();

router.route('/').get(getStudents).post(createStudent);
router.route('/:id').get(getStudentById).patch(updateStudent).delete(deleteStudent);

export default router;

