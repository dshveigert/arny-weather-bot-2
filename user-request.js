let requests = {};
function userRequest(userId, field, data) {
  console.log('userRequest:  ', userId, field, data);
  if (requests.hasOwnProperty(userId)) {
    requests = {...requests, [userId]: {...requests[userId], [field]: data}};
  } else {
    requests[userId] = {[field]: data};
  }
  console.log('userRequest response:  ', JSON.stringify(requests));
  return requests[userId];
}
module.exports = userRequest;
