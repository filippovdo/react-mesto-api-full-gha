const cardRoutes = require('express').Router();
const {
  getCards,
  deleteCard,
  createCard,
  likeCard,
  dislikeCard,
} = require('../controllers/card');
const { validateCardId, validateCard } = require('../utils/validators/cardValidator');

cardRoutes.get('/', getCards);
cardRoutes.delete('/:cardId', validateCardId, deleteCard);
cardRoutes.post('/', validateCard, createCard);
cardRoutes.put('/:cardId/likes', validateCardId, likeCard);
cardRoutes.delete('/:cardId/likes', validateCardId, dislikeCard);

module.exports = cardRoutes;
