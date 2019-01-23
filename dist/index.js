'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _firebaseFunctions = require('firebase-functions');

var functions = _interopRequireWildcard(_firebaseFunctions);

var _firebaseAdmin = require('firebase-admin');

var admin = _interopRequireWildcard(_firebaseAdmin);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function parseError(error) {
  var message = 'Error to process the task';
  if (Object.prototype.toString.call(error) === '[object Error]') {
    message = error.message;
  } else if (Object.prototype.toString.call(error) === '[object String]') {
    message = error;
  } else if (error !== undefined && error !== null) {
    message = JSON.stringify(error);
  }
  return {
    message: message,
    stack: error.stack || null
  };
}

exports.default = function (key, callback) {
  // Get next task without error
  function nextTask(databaseRef) {
    return databaseRef.child('tasks').orderByChild('_error').equalTo(null).limitToFirst(1).once('value').then(function (res) {
      return res.val();
    }).then(function (res) {
      if (!res) return null;
      var id = Object.keys(res).pop();
      return { id: id, task: res[id] };
    });
  }

  function runTask(databaseRef, options, context) {
    var id, task, _ref, snapshot, current_id, updates;

    return Promise.resolve().then(function () {
      if (!options) {
        return false;
      } else {
        return Promise.resolve().then(function () {
          id = options.id;
          task = options.task;
          return databaseRef.child('current').transaction(function (p) {
            return p || id;
          });
        }).then(function (_resp) {
          _ref = _resp;
          snapshot = _ref.snapshot;
          current_id = snapshot.val();


          if (current_id !== id) {
            return false;
          } else {
            return Promise.resolve().then(function () {
              updates = { current: null };
              return Promise.resolve().then(function () {
                return callback(task, context);
              }).then(function () {

                updates['tasks/' + id] = null;
              }).catch(function (error) {
                console.log('ERROR', error);
                updates['tasks/' + id + '/_error'] = parseError(error);
              });
            }).then(function () {
              return databaseRef.update(updates);
            }).then(function () {
              return true;
            });
          }
        });
      }
    }).then(function () {});
  }

  function replaceParams() {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return Object.keys(params).reduce(function (str, p) {
      return str.replace('{' + p + '}', params[p]);
    }, key);
  }

  function startQueue(snapshot, context) {
    var databaseRef, _temp;

    return Promise.resolve().then(function () {
      databaseRef = admin.database().ref(replaceParams(context.params));
      return Promise.all([databaseRef, nextTask(databaseRef), context]);
    }).then(function (_resp) {
      _temp = _resp;

      return runTask(_temp[0], _temp[1], _temp[2]);
    });
  }

  var onCreateTask = functions.database.ref('/' + key + '/tasks/{id}').onCreate(startQueue);

  var onFinishTask = functions.database.ref('/' + key + '/current').onDelete(startQueue);

  var onRetryTask = functions.database.ref('/' + key + '/tasks/{id}/_error').onDelete(startQueue);

  return { onCreateTask: onCreateTask, onFinishTask: onFinishTask, onRetryTask: onRetryTask };
};