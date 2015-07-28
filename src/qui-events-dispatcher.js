var EventsDispatcher = (function () {

    function getAsArray(value) {
        return value instanceof Array ? value : [value];
    }

    function isEmptyObject(obj) {
        for (var key in obj)
            if (Object.prototype.hasOwnProperty.call(obj, key))
                return false;
        return true;
    }

    function createSenderIfNotExist(parent, id) {
        if (Object.prototype.hasOwnProperty.call(parent, id))
            return;
        var value = undefined;
        parent[id] = function (newValue) {
            return newValue ? value = newValue : value;
        };
    }

    function addHandlers(sender, handlers) {
        var allHandlers = sender();
        sender(allHandlers ? allHandlers.concat(handlers) : handlers.slice());
    }

    function removeHandlers(sender, handlers) {
        var allHandlers = sender();
        if (allHandlers === undefined)
            return;
        for (var i = 0, removeIndex; i < handlers.length; i++)
            if ((removeIndex = allHandlers.indexOf(handlers[i])) != -1)
                allHandlers.splice(removeIndex, 1);
        if (allHandlers.length === 0)
            sender(undefined);
    }


    function Event(options) {
        this.data = options.data;
        this.stopped = false;
    }

    Event.prototype = {
        handle: function (callback, options) {
            var me = this;
            callback.apply(me, options ? options.args : []);
            return me.stopped;
        }
    };

    function EventsDispatcher() {
        this._senders = {};
    }

    EventsDispatcher.prototype = {
        on: function (ids, handlers) {
            ids = getAsArray(ids);
            handlers = getAsArray(handlers);
            var me = this,
                sender = me._resolveSender(ids);
            addHandlers(sender, handlers);
        },
        off: function (ids, handlers) {
            ids = getAsArray(ids);
            handlers = getAsArray(handlers);
            var me = this,
                sender = me._resolveSender(ids);
            removeHandlers(sender, handlers);
            me._clearEmptySenders(ids);
        },
        fire: function (ids, options) {
            ids = getAsArray(ids);
            var me = this,
                event = new me.Event(options);
            me._travel(ids, event);
        },
        clear: function (ids) {
            var me = this, sender;
            if (!ids)
                return me._senders = {};
            if (sender = me._eachSender(ids))
                delete sender[ids[ids.length - 1]];
        },
        _eachSender: function (ids, callback) {
            var parent = this._senders;
            for (var i = 0, lastIndex = ids.length - 1; i < ids.length; parent = parent[ids[i++]])
                if ((callback && callback(parent, ids[i])) || i === lastIndex)
                    return parent;
        },
        _travel: function (ids, event) {
            var me = this;
            me._eachSender(ids, function (parent, id) {
                createSenderIfNotExist(parent, id);
                for (var i = 0, callbacks = parent[id]() || []; i < callbacks.length; i++)
                    event.handle(callbacks[i]);
            });
        },
        _resolveSender: function (ids) {
            var me = this;
            return me._eachSender(ids, createSenderIfNotExist)[ids[ids.length - 1]];
        },
        _clearEmptySenders: function (ids) {
            var me = this,
                stack = [];
            me._eachSender(ids, function (parentSender, id) {
                stack.push([parentSender, id]);
            });
            stack.reverse();
            for (var i = 0, parentSender = stack[i][0], id = stack[i][1]; i < stack.length; i++)
                if (isEmptyObject(parentSender[id]) && !parentSender[id]())
                    delete parentSender[id];
                else
                    return;
        },
        Event: Event
    };

    return EventsDispatcher;
})();