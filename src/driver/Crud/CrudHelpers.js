var _ = require('lodash');


function createNewId() {
	return _.uniqueId('new10000000');
}

function createErrorReject(command, c, message, errors, req, cb) {
	let stringErrors = [];
	if (errors.length) {
		stringErrors = _.filter(_.map(errors, (e) => {
			if (typeof e != "string") {
				if (e.message) {
					return e.message;
				} else {
					return "";
				}

			} return e
		}), (e) => e);
	} else {
		if (typeof errors == "string") {
			stringErrors = [errors]
		} else {

			stringErrors = [errors.toString()]

		}
	}

	stringErrors.push(message)
	req.command = command;
	req.errors = stringErrors;
	c.rollback(() => {
		cb(req);
	});
}


module.exports = {createErrorReject:createErrorReject, createNewId:createNewId};