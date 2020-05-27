module.exports = {
    // CLIENT -> SERVER
    REQ_MS_CHAN_INFO: 'REQ_MS_CHAN_INFO',           // {id} -> {id, name, type, users: [{id, name}, ...]
    REQ_MS_FIND_CHAN: 'REQ_MS_FIND_CHAN',           // {search} -> {id, name, type}
    REQ_MS_USER_INFO: 'REQ_MS_USER_INFO',           // {id} -> {id, name}
    REQ_MS_JOIN_CHAN: 'REQ_MS_JOIN_CHAN',           // {name} -> {id, name}
    MS_LEAVE_CHAN: 'MS_LEAVE_CHAN',                 // {id}
    MS_SAY: 'MS_SAY',                               // {channel, message}

    // SERVER -> CLIENT
    MS_YOU_JOIN: 'MS_YOU_JOIN',                     // {id, name, type}
    MS_YOU_LEAVE: 'MS_YOU_LEAVE',                   // {id}
    MS_USER_JOINS: 'MS_USER_JOINS',                 // {user, channel}
    MS_USER_LEAVES: 'MS_USER_LEAVES',               // {user, channel}
    MS_USER_SAYS: 'MS_USER_SAYS'                    // {user, channel, message}
};