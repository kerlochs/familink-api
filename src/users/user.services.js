const _ = require('lodash');
const log = require('../helpers/logger.helper');
const UserModel = require('./user.model');
const contactService = require('../contacts/contact.services');
const profileConstants = require('../profiles/profiles.constantes');

function validatePassword(password) {
  if (!password) {
    throw new Error('Password must be defined');
  }

  if (password.length !== 4) {
    throw new Error('Password length must be equal to 4');
  }
  if (_.isNumber(password)) {
    throw new Error('Password must be number');
  }

  return true;
}

function createUser(phone, password, firstName, lastName, email, profile, contactsLength) {
  let cl;
  if (contactsLength) {
    cl = parseInt(contactsLength, 10);
  }

  const newUser = validatePassword(password) && new UserModel({
    phone,
    password,
    firstName,
    lastName,
    email,
    profile,
    contacts: contactService.generateMockContacts(cl),
  });

  return newUser.save()
    .then((user) => {
      log.info('User created', user);
      return Promise.resolve(user);
    })
    .catch((e) => {
      log.error('User error', e);
      return Promise.reject(e);
    });
}

function updateUser(id, firstName, lastName, email, profile) {
  const update = {};
  if (firstName) {
    update.firstName = firstName;
  }
  if (lastName) {
    update.lastName = lastName;
  }
  if (email) {
    update.email = email;
  }
  if (profile) {
    update.profile = profile;
  }

  return new Promise((resolve, reject) => {
    UserModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true },
      (err, user) => {
        if (err) {
          reject(err);
        }
        resolve(user);
      });
  });
}

function getUsers() {
  const query = UserModel.find();
  return query.exec()
    .then((users) => {
      log.info('Get Users', users);
      return Promise.resolve(users);
    })
    .catch((e) => {
      log.error('Get users error', e);
      return Promise.reject(e);
    });
}

function getContacts(userPhone) {
  return this.getUserByPhone(userPhone)
    .then(user => Promise.resolve(user.contacts))
    .catch(e => Promise.reject(e));
}

function addContact(
  userPhone,
  phone,
  firstName,
  lastName,
  email,
  profile = profileConstants.PROFILE_FAMILLE,
  gravatar,
  isFamilinkUser = false,
  isEmergencyUser = false,
) {
  return this.getUserByPhone(userPhone)
    .then((user) => {
      user.contacts.push({
        phone,
        firstName,
        lastName,
        email,
        profile,
        gravatar,
        isFamilinkUser,
        isEmergencyUser,
      });
      return user.save()
        .then(savedUser => Promise.resolve(user.contacts[savedUser.contacts.length - 1]));
    })
    .catch(e => Promise.reject(e));
}

function deleteContact(userPhone, idContact) {
  return this.getUserByPhone(userPhone)
    .then((user) => {
      user.contacts.id(idContact).remove();
      return user.save({ validateBeforeSave: false });
    })
    .catch(e => Promise.reject(e));
}

function updateContact(
  userPhone,
  idContact,
  phone,
  firstName,
  lastName,
  email,
  profile,
  gravatar,
  isFamilinkUser,
  isEmergencyUser,
) {
  const set = {};
  if (phone) {
    set['contacts.$.phone'] = phone;
  }
  if (firstName) {
    set['contacts.$.firstName'] = firstName;
  }
  if (lastName) {
    set['contacts.$.lastName'] = lastName;
  }
  if (email) {
    set['contacts.$.email'] = email;
  }
  if (profile) {
    set['contacts.$.profile'] = profile;
  }
  if (_.isString(gravatar) && gravatar) {
    set['contacts.$.gravatar'] = gravatar;
  }
  if (_.isBoolean(isFamilinkUser)) {
    set['contacts.$.isFamilinkUser'] = isFamilinkUser;
  }
  if (_.isBoolean(isEmergencyUser)) {
    set['contacts.$.isEmergencyUser'] = isEmergencyUser;
  }

  return UserModel
    .where({ phone: userPhone, 'contacts._id': idContact })
    .update({ $set: set })
    .exec();
}

function getUserById(id) {
  return UserModel.findOne({ _id: id })
    .then((user) => {
      if (!user) {
        throw new Error('User not found');
      }
      return Promise.resolve(user);
    })
    .catch(e => Promise.reject(e));
}

function getUserByPhone(phone) {
  return UserModel.findOne({ phone })
    .then((user) => {
      if (!user) {
        throw new Error('User not found');
      }
      log.info('Get User by login', user);
      return Promise.resolve(user);
    })
    .catch((e) => {
      log.error('Get users by login error', e);
      return Promise.reject(e);
    });
}

module.exports = {
  createUser,
  updateUser,
  getUsers,
  getUserByPhone,
  getUserById,
  getContacts,
  addContact,
  deleteContact,
  updateContact,
};
