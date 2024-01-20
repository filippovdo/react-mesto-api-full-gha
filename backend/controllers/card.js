const Card = require('../models/card');
const {
  NOT_FOUND_ERROR_CODE,
  DEFAULT_ERROR_CODE,
  INCORRECT_DATA_ERROR_CODE,
} = require('../utils/constants');
const BadRequestError = require('../utils/errors/badRequestError');
const NotFoundError = require('../utils/errors/notFoundError');
const ForbiddenError = require('../utils/errors/forbiddenError');

const USER_REF = [
  { path: 'likes', model: 'user' },
  { path: 'owner', model: 'user' },
];

module.exports.getCards = async (req, res, next) => {
  try {
    const cards = await Card.find({});
    res.send(cards);
  } catch (e) {
    next(e);
  }
};

module.exports.createCard = async (req, res, next) => {
  try {
    const { name, link } = req.body;
    const card = await Card.create({ name, link, owner: req.user._id });

    res.send({
      card,
    });
  } catch (e) {
    if (e.name === 'ValidationError') {
      next(new BadRequestError(e.message));
    } else {
      next(e);
    }
  }
};

module.exports.deleteCard = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) {
      throw new NotFoundError('Карточка не найдена');
    }
    if (card.owner.toString() !== req.user._id) {
      throw new ForbiddenError('Нельзя удалять чужие карточки');
    }
    const cardDelete = await Card.findByIdAndRemove(req.params.cardId);
    res.send({
      message: 'Карточка удалена',
    });
  } catch (e) {
    if (e.name === 'CastError') {
      next(new BadRequestError('Переданы не валидные данные'));
    } else {
      next(e);
    }
  }
};

const handleCardLike = async (req, res, next, options) => {
  try {
    const action = options.addLike ? '$addToSet' : '$pull';

    const updatedCard = await Card.findByIdAndUpdate(
      req.params.cardId,
      { [action]: { likes: req.user._id } },
      { new: true },
    ).populate(USER_REF);

    if (!updatedCard) {
      throw new NotFoundError('Карточка не найдена');
    }

    res.send({
      updatedCard,
    });
  } catch (e) {
    if (e.name === 'CastError') {
      next(new BadRequestError('Переданы не валидные данные'));
    } else {
      next(e);
    }
  }
};

module.exports.likeCard = (req, res, next) => {
  handleCardLike(req, res, next, { addLike: true });
};

module.exports.dislikeCard = (req, res, next) => {
  handleCardLike(req, res, next, { addLike: false });
};
