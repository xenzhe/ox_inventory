if not lib then return end

local Inventory = require 'modules.inventory.server'
local Items = require 'modules.items.server'

local RATE_LIMIT = 400
local TEST_STASH = 'ox_inventory_testdrag'
local lastGive = {}

local function isRateLimited(src)
    local now = GetGameTimer()

    if lastGive[src] and now - lastGive[src] < RATE_LIMIT then
        lib.print.warn(('player %s is sending world gives too fast'):format(src))
        return true
    end

    lastGive[src] = now
end

local function isInRange(src, target)
    local fromPed, toPed = GetPlayerPed(src), GetPlayerPed(target)

    if fromPed == 0 or toPed == 0 then return false end

    return #(GetEntityCoords(fromPed) - GetEntityCoords(toPed)) <= shared.worldgivedistance + 1.0
end

lib.callback.register('ox_inventory:worldGive', function(source, slot, target, count)
    local src = source

    if not shared.worldgive or isRateLimited(src) then return end

    if type(slot) ~= 'number' or type(target) ~= 'number' or type(count) ~= 'number' then
        lib.print.warn(('player %s sent an invalid world give payload'):format(src))
        return
    end

    local item = Inventory(src)?.items[slot]

    if not item then return end

    if target == src or not Inventory(target)?.player or not isInRange(src, target) then
        return { 'cannot_give', count, item.label }
    end

    local failed = Inventory.GiveItem(src, slot, target, count)

    if not failed then
        TriggerClientEvent('ox_inventory:worldGiveReceived', target, src)
    end

    return failed
end)

lib.addCommand('testdrag', {
    help = locale('testdrag_help'),
    restricted = 'group.admin',
    params = {
        { name = 'action', type = 'string', help = locale('testdrag_action_help'), optional = true },
    },
}, function(source, args)
    TriggerClientEvent('ox_inventory:testDrag', source, args.action)
end)

local function getTestStash(src)
    local player = Inventory(src)

    if not player then return end

    return Inventory({ id = TEST_STASH, owner = player.owner }), player
end

lib.callback.register('ox_inventory:testDragGive', function(source, slot, count)
    local src = source

    if not IsPlayerAceAllowed(src, 'command.testdrag') or isRateLimited(src) then return end
    if type(slot) ~= 'number' or type(count) ~= 'number' then return end

    local stash, player = getTestStash(src)

    if not stash or not player then return end

    local data = player.items[slot]
    local item = data and Items(data.name)

    count = math.max(1, math.floor(count))

    if not item or data.count < count or not Inventory.CanCarryItem(stash, item, count, data.metadata) then
        return { 'cannot_give', count, data and data.label or '?' }
    end

    local metadata = data.metadata

    if Inventory.RemoveItem(player, item, count, metadata, slot) then
        if Inventory.AddItem(stash, item, count, metadata) then return end

        Inventory.AddItem(player, item, count, metadata, slot)
    end

    return { 'cannot_give', count, data.label }
end)

lib.callback.register('ox_inventory:testDragStash', function(source)
    if not IsPlayerAceAllowed(source, 'command.testdrag') then return end

    return TEST_STASH
end)

CreateThread(function()
    while not shared.ready do Wait(100) end

    exports.ox_inventory:RegisterStash(TEST_STASH, locale('testdrag_npc'), 30, 60000, true)
end)

AddEventHandler('playerDropped', function()
    lastGive[source] = nil
end)
