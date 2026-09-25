if not lib then return end

local Utils = require 'modules.utils.client'

local HEAD_BONE = 31086
local TICK = 33
local SEARCH_PADDING = 6.0
local NPC_MODEL = `a_m_y_business_01`
local NPC_SCENARIO = 'WORLD_HUMAN_STAND_IMPATIENT'

local hooks
local aiming = false
local testNpc

local function round(value)
    return math.floor(value * 10000 + 0.5) / 10000
end

local function project(coords)
    local onScreen, x, y = GetScreenCoordFromWorldCoord(coords.x, coords.y, coords.z)

    if onScreen then return x, y end
end

local function describe(ped, key, origin)
    if not ped or not DoesEntityExist(ped) or not IsEntityVisible(ped) or IsPedDeadOrDying(ped, true) then return end

    local head = GetPedBoneCoords(ped, HEAD_BONE, 0.0, 0.0, 0.0)
    local body = GetEntityCoords(ped)
    local hx, hy = project(vec3(head.x, head.y, head.z + 0.28))
    local fx, fy = project(vec3(body.x, body.y, body.z - 0.98))

    if not hx or not fx then return end

    local distance = #(origin - body)
    local reason

    if distance > shared.worldgivedistance then
        reason = 'far'
    elseif not HasEntityClearLosToEntity(cache.ped, ped, 17) then
        reason = 'blocked'
    end

    return {
        key = key,
        x = round((hx + fx) / 2),
        top = round(hy),
        bottom = round(fy),
        reason = reason,
        npc = key == 'npc' or nil,
    }
end

local function collect()
    local list = {}

    if cache.vehicle then return list end

    local origin = GetEntityCoords(cache.ped)
    local players = lib.getNearbyPlayers(origin, shared.worldgivedistance + SEARCH_PADDING, false)

    for i = 1, #players do
        local player = players[i]
        list[#list + 1] = describe(player.ped, ('p:%d'):format(GetPlayerServerId(player.id)), origin)
    end

    if testNpc then
        list[#list + 1] = describe(testNpc, 'npc', origin)
    end

    return list
end

local function aimLoop()
    local last

    if client.screenblur then Utils.blurOut() end

    while aiming and hooks.canGive() do
        local list = collect()
        local encoded = json.encode(list)

        if encoded ~= last then
            last = encoded
            SendNUIMessage({ action = 'worldGiveCandidates', data = list })
        end

        Wait(TICK)
    end

    aiming = false
    SendNUIMessage({ action = 'worldGiveCandidates', data = {} })

    if client.screenblur and hooks.isOpen() then Utils.blurIn() end
end

local function resolve(key)
    if key == 'npc' then return testNpc end

    local serverId = tonumber(key:match('^p:(%d+)$'))

    if not serverId then return end

    local player = GetPlayerFromServerId(serverId)

    if player == -1 then return end

    return GetPlayerPed(player), serverId
end

local function playReceive(ped)
    lib.requestAnimDict('mp_common')
    TaskPlayAnim(ped, 'mp_common', 'givetake1_b', 2.0, 2.0, 1800, 50, 0.0, false, false, false)
    RemoveAnimDict('mp_common')
end

RegisterNUICallback('worldGiveAim', function(active, cb)
    cb(1)

    active = active == true and shared.worldgive

    if active == aiming then return end

    aiming = active

    if aiming then CreateThread(aimLoop) end
end)

RegisterNUICallback('worldGive', function(data, cb)
    if type(data) ~= 'table' or type(data.slot) ~= 'number' or type(data.count) ~= 'number' or type(data.target) ~= 'string' then
        return cb(false)
    end

    if not shared.worldgive or not hooks.canGive() or cache.vehicle then return cb(false) end

    local ped, serverId = resolve(data.target)

    if not ped or not DoesEntityExist(ped) then return cb(false) end

    if #(GetEntityCoords(cache.ped) - GetEntityCoords(ped)) > shared.worldgivedistance or not HasEntityClearLosToEntity(cache.ped, ped, 17) then
        return cb(false)
    end

    hooks.disarm(data.slot)
    TaskTurnPedToFaceEntity(cache.ped, ped, 500)
    Utils.PlayAnim(0, 'mp_common', 'givetake1_a', 1.0, 1.0, 2000, 50, 0.0, 0, 0, 0)

    local failed

    if serverId then
        failed = lib.callback.await('ox_inventory:worldGive', false, data.slot, serverId, data.count)
    else
        failed = lib.callback.await('ox_inventory:testDragGive', false, data.slot, data.count)

        if not failed then
            playReceive(ped)
            SetTimeout(1900, function()
                if testNpc == ped and DoesEntityExist(ped) then
                    TaskStartScenarioInPlace(ped, NPC_SCENARIO, 0, true)
                end
            end)
        end
    end

    if failed then
        lib.notify({ type = 'error', description = locale(table.unpack(failed)) })
    end

    cb(not failed)
end)

RegisterNetEvent('ox_inventory:worldGiveReceived', function()
    if cache.vehicle or IsPedDeadOrDying(cache.ped, true) or IsPedRagdoll(cache.ped) then return end

    playReceive(cache.ped)
end)

local function removeTestNpc()
    if testNpc and DoesEntityExist(testNpc) then
        DeleteEntity(testNpc)
    end

    testNpc = nil
end

local function spawnTestNpc()
    if not pcall(lib.requestModel, NPC_MODEL, 5000) then
        return lib.print.error('test npc model failed to load')
    end

    local coords = GetOffsetFromEntityInWorldCoords(cache.ped, 0.0, 1.6, 0.0)
    local found, groundZ = GetGroundZFor_3dCoord(coords.x, coords.y, coords.z + 1.0, false)
    local ped = CreatePed(4, NPC_MODEL, coords.x, coords.y, found and groundZ or coords.z - 1.0, GetEntityHeading(cache.ped) + 180.0, false, true)

    SetModelAsNoLongerNeeded(NPC_MODEL)
    SetEntityInvincible(ped, true)
    SetBlockingOfNonTemporaryEvents(ped, true)
    SetPedCanRagdoll(ped, false)
    FreezeEntityPosition(ped, true)
    TaskStartScenarioInPlace(ped, NPC_SCENARIO, 0, true)

    testNpc = ped
end

RegisterNetEvent('ox_inventory:testDrag', function(action)
    if action == 'open' then
        local stash = lib.callback.await('ox_inventory:testDragStash', false)

        if stash then client.openInventory('stash', stash) end

        return
    end

    if testNpc then
        removeTestNpc()
        return lib.notify({ description = locale('testdrag_removed') })
    end

    spawnTestNpc()

    if testNpc then
        lib.notify({ type = 'success', description = locale('testdrag_spawned') })
    end
end)

AddEventHandler('onResourceStop', function(resource)
    if resource ~= cache.resource then return end

    aiming = false
    removeTestNpc()
end)

---@param handlers { canGive: fun(): boolean, isOpen: fun(): boolean, disarm: fun(slot: number) }
return function(handlers)
    hooks = handlers
end
