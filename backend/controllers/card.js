const { constants } = require('http2');

const CardModel = require('../models/card');
const NotFoundError = require('../errors/not-found-err');
const ForbiddenError = require('../errors/forbidden-err');
const BadRequestError = require('../errors/bad-request-err');
const InternalServerError = require('../errors/internal-server-err');

const postCard = (req, res, next) => {
  const { name, link } = req.body;
  const owner = req.user._id;

  CardModel.create({ name, link, owner })
    .then((card) => res.status(constants.HTTP_STATUS_CREATED).send({ data: card }))
    .catch((e) => {
      if (e.name === 'ValidationError') {
        next(new BadRequestError('Неверно заполнены поля'));
      } else {
        next(new InternalServerError('Не удалось создать карточку'));
      }
    });
};

const getCards = (req, res, next) => CardModel.find({ owner: req.user._id })
  .then((cards) => res.send({ data: cards }))
  .catch(() => {
    const err = new InternalServerError('Не удалось загрузить карточки');
    return next(err);
  });

const putLike = (req, res, next) => {
  const { cardId } = req.params;
  const userId = req.user._id;

  CardModel.findByIdAndUpdate(
    cardId,
    {
      $push: { likes: userId },
    },
    { new: true },
  )
    .orFail()
    .then(() => res
      .status(constants.HTTP_STATUS_OK)
      .send({ message: 'Карточка лайкнута' }))
    .catch((e) => {
      let err;
      if (e.name === 'DocumentNotFoundError') {
        err = new NotFoundError('Карточка не найдена');
      } else if (e.name === 'CastError') {
        err = new BadRequestError('Неверный формат данных');
      } else {
        err = new InternalServerError('Нет возможности поставить like');
      }
      return next(err);
    });
};

const deleteLike = (req, res, next) => {
  const { cardId } = req.params;
  const userId = req.user._id;

  CardModel.findByIdAndUpdate(
    cardId,
    {
      $pull: { likes: userId },
    },
    { new: true },
  )
    .orFail()
    .then(() => res.send({ message: 'Удалили лайк' }))
    .catch((e) => {
      let err;
      if (e.name === 'DocumentNotFoundError') {
        err = new NotFoundError('Карточка не найдена');
      } else if (e.name === 'CastError') {
        err = new BadRequestError('Неверный формат данных');
      } else {
        err = new InternalServerError('Нет возможности поставить like');
      }
      return next(err);
    });
};

const deleteCard = (req, res, next) => CardModel.findById(req.params.cardId)
  .orFail()
  .then(({ _doc }) => {
    if (!_doc.owner.equals(req.user._id)) {
      const error = new ForbiddenError('Не ваша карта');
      return next(error);
    }
    return CardModel.findByIdAndRemove(req.params.cardId);
  })
  .then(() => res.status(constants.HTTP_STATUS_OK).send({ message: 'Карта удалена' }))
  .catch((e) => {
    let err;
    if (e.name === 'DocumentNotFoundError') {
      err = new NotFoundError('Карточка не найдена');
    } else {
      err = new InternalServerError('Вы не можете удалить эту карточку');
    }
    return next(err);
  });

module.exports = {
  postCard,
  getCards,
  putLike,
  deleteLike,
  deleteCard,
};
