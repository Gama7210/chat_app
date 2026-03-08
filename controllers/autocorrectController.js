import { localAutocorrect } from '../services/autocorrectService.js';
import { AppError } from '../middlewares/errorMiddleware.js';

export async function autocorrect(req, res, next) {
  try {
    const { text } = req.body;
    if (!text?.trim()) throw new AppError('Texto vacío', 400, 'Escribe algo primero');
    if (text.length > 1000) throw new AppError('Texto demasiado largo', 400, 'Máximo 1000 caracteres');

    const { corrected, changes, changed } = localAutocorrect(text);

    res.json({ status: 'success', original: text, corrected, changed, changes });
  } catch (err) {
    next(err);
  }
}