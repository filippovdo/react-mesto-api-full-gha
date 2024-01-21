const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  link: {
    type: String,
    required: true,
    validate: [
      (v) => /https?:\/\/.*\.?/.test(v),
      (props) => `${props.value} неверная ссылка`,
    ],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'user',
  },
  likes: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    default: [],
    ref: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('card', cardSchema);
