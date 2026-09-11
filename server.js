// =====================================================
// =====================================================
//                  7BETS SERVER
//                 POPRAWIONY V7
// =====================================================
// =====================================================
//
// SERVER.JS — CZĘŚĆ 1/6
//
// ✅ saldo aktualizowane od razu
// ✅ nagroda 50 zł / 5 minut
// ✅ bonus startowy
// ✅ Discord link
// ✅ maintenance
// ✅ eventy
// ✅ LUCK
// ✅ MONEY x2 / x3
// ✅ Crash Event
//
// W NASTĘPNYCH CZĘŚCIACH:
//
// 2/6 — stary interface + OKRĄGŁY event timer
// 3/6 — skrzynki + 1/2/3/5/10/25 animacji naraz
// 4/6 — Miner + Tower + AKTUALNY ZYSK
// 5/6 — Zdrapka / Sloty / Ruletka / Lucky / Crash
// 6/6 — cleanup + start serwera
//
// =====================================================


// =====================================================
// MODUŁY
// =====================================================

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");


// =====================================================
// EXPRESS
// =====================================================

const app = express();

const PORT =
    Number(
        process.env.PORT ||
        3000
    );


// =====================================================
// PLIKI
// =====================================================

const USERS_FILE =
    path.join(
        __dirname,
        "users.json"
    );

const PENDING_FILE =
    path.join(
        __dirname,
        "pending_links.json"
    );

const EVENTS_FILE =
    path.join(
        __dirname,
        "events.json"
    );

const MAINTENANCE_FILE =
    path.join(
        __dirname,
        "maintenance.json"
    );

const SETTINGS_FILE =
    path.join(
        __dirname,
        "settings.json"
    );

const ADMINS_FILE =
    path.join(
        __dirname,
        "admins.json"
    );

const LOGS_FILE =
    path.join(
        __dirname,
        "admin_logs.json"
    );


// =====================================================
// DEFAULT SETTINGS
// =====================================================

const DEFAULT_SETTINGS = {

    economyEnabled:
        true,

    registrationsEnabled:
        true,

    rewardsEnabled:
        true,


    // BONUS STARTOWY

    startReward:
        200,


    // NAGRODA CZASOWA

    timedReward:
        50,

    rewardCooldown:
        5 *
        60 *
        1000,


    economyResetAt:
        null,

    economyResetBy:
        null

};


// =====================================================
// DEFAULT MAINTENANCE
// =====================================================

const DEFAULT_MAINTENANCE = {

    server:
        false,

    serverStartedAt:
        null,

    serverStartedBy:
        null,

    games:
        {}

};


// =====================================================
// JSON — TWORZENIE
// =====================================================

function ensureFile(
    file,
    fallback
){

    try{

        if(
            fs.existsSync(
                file
            )
        ){

            return;

        }


        fs.writeFileSync(

            file,

            JSON.stringify(
                fallback,
                null,
                2
            ),

            "utf8"

        );

    }

    catch(error){

        console.error(
            "❌ Nie można utworzyć:",
            path.basename(
                file
            )
        );

        console.error(
            error
        );

    }

}


// =====================================================
// JSON — ODCZYT
// =====================================================

function loadJson(
    file,
    fallback
){

    ensureFile(
        file,
        fallback
    );


    try{

        const text =
            fs.readFileSync(
                file,
                "utf8"
            );


        if(
            !text.trim()
        ){

            return structuredClone(
                fallback
            );

        }


        return JSON.parse(
            text
        );

    }

    catch(error){

        console.error(
            "❌ Błąd JSON:",
            path.basename(
                file
            )
        );

        console.error(
            error.message
        );


        return structuredClone(
            fallback
        );

    }

}


// =====================================================
// JSON — ZAPIS
// =====================================================
//
// Prostsza wersja pod Windows.
// BOT.JS korzysta z tych samych plików.
//
// =====================================================

function saveJson(
    file,
    data
){

    try{

        fs.writeFileSync(

            file,

            JSON.stringify(
                data,
                null,
                2
            ),

            "utf8"

        );


        return true;

    }

    catch(error){

        console.error(
            "❌ Błąd zapisu:",
            path.basename(
                file
            )
        );

        console.error(
            error
        );


        return false;

    }

}


// =====================================================
// TWORZENIE PLIKÓW
// =====================================================

ensureFile(
    USERS_FILE,
    {}
);

ensureFile(
    PENDING_FILE,
    {}
);

ensureFile(
    EVENTS_FILE,
    []
);

ensureFile(
    MAINTENANCE_FILE,
    DEFAULT_MAINTENANCE
);

ensureFile(
    SETTINGS_FILE,
    DEFAULT_SETTINGS
);

ensureFile(
    ADMINS_FILE,
    []
);

ensureFile(
    LOGS_FILE,
    []
);


// =====================================================
// USERS
// =====================================================

function loadUsers(){

    const users =
        loadJson(
            USERS_FILE,
            {}
        );


    if(
        !users ||
        typeof users !== "object" ||
        Array.isArray(users)
    ){

        return {};

    }


    return users;

}


function saveUsers(
    users
){

    return saveJson(
        USERS_FILE,
        users
    );

}


// =====================================================
// SETTINGS
// =====================================================

function loadSettings(){

    const data =
        loadJson(
            SETTINGS_FILE,
            DEFAULT_SETTINGS
        );


    if(
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ){

        return structuredClone(
            DEFAULT_SETTINGS
        );

    }


    return {

        ...DEFAULT_SETTINGS,
        ...data

    };

}


function saveSettings(
    data
){

    return saveJson(

        SETTINGS_FILE,

        {

            ...DEFAULT_SETTINGS,
            ...data

        }

    );

}


// =====================================================
// MAINTENANCE
// =====================================================

function loadMaintenance(){

    const data =
        loadJson(
            MAINTENANCE_FILE,
            DEFAULT_MAINTENANCE
        );


    if(
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ){

        return structuredClone(
            DEFAULT_MAINTENANCE
        );

    }


    const games =
        (
            data.games &&
            typeof data.games === "object" &&
            !Array.isArray(
                data.games
            )
        )
            ?
            data.games
            :
            {};


    return {

        ...DEFAULT_MAINTENANCE,
        ...data,

        server:
            data.server === true,

        games:
            games

    };

}


function saveMaintenance(
    data
){

    return saveJson(
        MAINTENANCE_FILE,
        data
    );

}


// =====================================================
// CAŁY SERWER MA MAINTENANCE?
// =====================================================

function isServerMaintenance(){

    const maintenance =
        loadMaintenance();


    return (
        maintenance.server ===
        true
    );

}


// =====================================================
// POJEDYNCZA GRA MA MAINTENANCE?
// =====================================================

function isGameMaintenance(
    game
){

    const maintenance =
        loadMaintenance();


    const key =
        String(
            game || ""
        )
        .trim()
        .toLowerCase();


    const state =
        maintenance.games?.[
            key
        ];


    if(
        state === true
    ){

        return true;

    }


    return (
        state?.active === true
    );

}


// =====================================================
// PENDING DISCORD
// =====================================================

function loadPending(){

    const data =
        loadJson(
            PENDING_FILE,
            {}
        );


    if(
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ){

        return {};

    }


    return data;

}


function savePending(
    data
){

    return saveJson(
        PENDING_FILE,
        data
    );

}


// =====================================================
// USUŃ PENDING DLA LOGINU
// =====================================================

function clearPendingForLogin(
    login
){

    const pending =
        loadPending();


    let changed =
        false;


    for(
        const [
            token,
            request
        ]
        of Object.entries(
            pending
        )
    ){

        if(
            String(
                request?.login || ""
            )
            .toLowerCase()
            ===
            String(
                login || ""
            )
            .toLowerCase()
        ){

            delete pending[
                token
            ];

            changed =
                true;

        }

    }


    if(
        changed
    ){

        savePending(
            pending
        );

    }

}


// =====================================================
// USUŃ PENDING DLA DISCORD ID
// =====================================================

function clearPendingForDiscordId(
    discordId
){

    const pending =
        loadPending();


    let changed =
        false;


    for(
        const [
            token,
            request
        ]
        of Object.entries(
            pending
        )
    ){

        if(
            String(
                request?.discordId || ""
            )
            ===
            String(
                discordId || ""
            )
        ){

            delete pending[
                token
            ];

            changed =
                true;

        }

    }


    if(
        changed
    ){

        savePending(
            pending
        );

    }

}


// =====================================================
// EVENTY
// =====================================================

function loadEvents(){

    let events =
        loadJson(
            EVENTS_FILE,
            []
        );


    if(
        !Array.isArray(
            events
        )
    ){

        events =
            [];

    }


    const now =
        Date.now();


    const active =
        events.filter(
            event => {

                const endsAt =
                    Number(
                        event?.endsAt || 0
                    );


                // brak endsAt = event bez końca

                if(
                    endsAt <= 0
                ){

                    return true;

                }


                return (
                    endsAt >
                    now
                );

            }
        );


    if(
        active.length !==
        events.length
    ){

        saveJson(
            EVENTS_FILE,
            active
        );

    }


    return active;

}


function saveEvents(
    events
){

    return saveJson(
        EVENTS_FILE,
        events
    );

}


// =====================================================
// POBIERANIE EVENTU
// =====================================================

function getEvent(
    type
){

    const wanted =
        String(
            type || ""
        )
        .trim()
        .toLowerCase();


    return (

        loadEvents()
            .find(
                event =>
                    String(
                        event?.type || ""
                    )
                    .trim()
                    .toLowerCase()
                    ===
                    wanted
            )

        ||

        null

    );

}


// =====================================================
// CZY EVENT ISTNIEJE
// =====================================================

function hasEvent(
    type
){

    return !!getEvent(
        type
    );

}


// =====================================================
// LUCK
// =====================================================

function isLuckActive(){

    return hasEvent(
        "luck"
    );

}


function getLuckBoost(){

    const event =
        getEvent(
            "luck"
        );


    if(
        !event
    ){

        return 1;

    }


    const value =
        Number(
            event.multiplier || 1.35
        );


    if(
        !Number.isFinite(
            value
        )
    ){

        return 1.35;

    }


    return Math.max(

        1,

        Math.min(
            2,
            value
        )

    );

}


// =====================================================
// MONEY EVENT
// =====================================================

function getMoneyMultiplier(){

    const events =
        loadEvents();


    let multiplier =
        1;


    for(
        const event
        of events
    ){

        const type =
            String(
                event?.type || ""
            )
            .toLowerCase();


        if(
            type ===
            "money_x2"
        ){

            multiplier =
                Math.max(
                    multiplier,
                    2
                );

        }


        if(
            type ===
            "money_x3"
        ){

            multiplier =
                Math.max(
                    multiplier,
                    3
                );

        }

    }


    return multiplier;

}


// =====================================================
// CRASH EVENT
// =====================================================

function getCrashEvent(){

    return getEvent(
        "crash_event"
    );

}


function isCrashEventActive(){

    return !!getCrashEvent();

}


// =====================================================
// MONEY
// =====================================================

function roundMoney(
    value
){

    const number =
        Number(
            value
        );


    if(
        !Number.isFinite(
            number
        )
    ){

        return 0;

    }


    return (

        Math.round(
            number *
            100
        )

        /

        100

    );

}


// =====================================================
// FORMAT MONEY
// =====================================================

function formatMoney(
    value
){

    return (

        new Intl.NumberFormat(
            "pl-PL",
            {

                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2

            }
        )
        .format(
            roundMoney(
                value
            )
        )

        +

        " zł"

    );

}


// =====================================================
// STATYSTYKI / NORMALIZACJA USERA
// =====================================================

function ensureStats(
    user,
    login = ""
){

    if(
        !user ||
        typeof user !== "object"
    ){

        return null;

    }


    // =================================================
    // LOGIN
    // =================================================

    if(
        !user.login &&
        login
    ){

        user.login =
            login;

    }


    // =================================================
    // MIGRACJA STAREJ KASY
    //
    // Jeżeli poprzednia wersja BOT.JS używała:
    //
    // balance
    // money
    //
    // przenosimy ją do saldo.
    // =================================================

    if(
        user.saldo === undefined ||
        user.saldo === null
    ){

        if(
            Number.isFinite(
                Number(
                    user.balance
                )
            )
        ){

            user.saldo =
                Number(
                    user.balance
                );

        }

        else if(
            Number.isFinite(
                Number(
                    user.money
                )
            )
        ){

            user.saldo =
                Number(
                    user.money
                );

        }

        else{

            user.saldo =
                0;

        }

    }


    user.saldo =
        roundMoney(
            user.saldo
        );


    // =================================================
    // STATYSTYKI
    // =================================================

    const numericFields = [

        "gry",

        "wygrane",

        "przegrane",

        "najwiekszaWygrana",

        "miner",

        "tower",

        "zdrapki",

        "sloty",

        "ruletka",

        "lucky",

        "crash",

        "skrzynkiOtwarte",

        "skrzynkiWydane",

        "skrzynkiWygrane"

    ];


    for(
        const field
        of numericFields
    ){

        const number =
            Number(
                user[
                    field
                ] || 0
            );


        user[
            field
        ] =
            Number.isFinite(
                number
            )
                ?
                number
                :
                0;

    }


    // =================================================
    // DISCORD
    // =================================================

    user.polaczono =
        user.polaczono === true;


    user.discordId =
        user.discordId
            ?
            String(
                user.discordId
            )
            :
            null;


    user.discordNick =
        user.discordNick
            ?
            String(
                user.discordNick
            )
            :
            null;


    // =================================================
    // BLOCK
    // =================================================

    user.blocked =
        user.blocked === true;


    // =================================================
    // BONUS STARTOWY
    // =================================================

    user.startOdebrany =
        (
            user.startOdebrany === true
            ||
            user.startClaimed === true
        );


    user.startClaimed =
        user.startOdebrany;


    // =================================================
    // NAGRODA
    //
    // obsługujemy stare i nowe nazwy pola
    // =================================================

    const lastReward =
        Math.max(

            Number(
                user.ostatniaNagroda || 0
            ),

            Number(
                user.lastReward || 0
            )

        );


    user.ostatniaNagroda =
        lastReward;


    user.lastReward =
        lastReward;


    // =================================================
    // POWIADOMIENIA
    // =================================================

    if(
        !Array.isArray(
            user.notifications
        )
    ){

        user.notifications =
            [];

    }


    // =================================================
    // CREATED
    // =================================================

    if(
        !user.createdAt
    ){

        user.createdAt =
            Date.now();

    }


    return user;

}


// =====================================================
// NORMALIZUJ WSZYSTKICH
// =====================================================

function normalizeUsers(){

    const users =
        loadUsers();


    for(
        const [
            login,
            user
        ]
        of Object.entries(
            users
        )
    ){

        ensureStats(
            user,
            login
        );

    }


    saveUsers(
        users
    );


    return users;

}


// =====================================================
// POWIADOMIENIA
// =====================================================

function notifyUser(
    user,
    type,
    title,
    message
){

    if(
        !user
    ){

        return;

    }


    ensureStats(
        user
    );


    user.notifications.push({

        id:
            crypto
                .randomBytes(
                    10
                )
                .toString(
                    "hex"
                ),

        type:
            String(
                type || "info"
            ),

        title:
            String(
                title || "7BETS"
            ),

        message:
            String(
                message || ""
            ),

        createdAt:
            Date.now()

    });


    if(
        user.notifications.length >
        60
    ){

        user.notifications =
            user.notifications.slice(
                -60
            );

    }

}


// =====================================================
// POWIADOM WSZYSTKICH
// =====================================================

function notifyEveryone(
    users,
    type,
    title,
    message
){

    for(
        const [
            login,
            user
        ]
        of Object.entries(
            users
        )
    ){

        ensureStats(
            user,
            login
        );


        notifyUser(

            user,
            type,
            title,
            message

        );

    }

}


// =====================================================
// LOGI
// =====================================================

function loadLogs(){

    const logs =
        loadJson(
            LOGS_FILE,
            []
        );


    return Array.isArray(
        logs
    )
        ?
        logs
        :
        [];

}


function addLog(
    actor,
    action,
    target = "-",
    details = ""
){

    const logs =
        loadLogs();


    logs.unshift({

        id:
            crypto
                .randomBytes(
                    8
                )
                .toString(
                    "hex"
                ),

        time:
            new Date()
                .toISOString(),

        actor:
            String(
                actor || "SERVER"
            ),

        action:
            String(
                action || "-"
            ),

        target:
            String(
                target || "-"
            ),

        details:
            String(
                details || ""
            )

    });


    saveJson(

        LOGS_FILE,

        logs.slice(
            0,
            500
        )

    );

}


// =====================================================
// HTML ESCAPE
// =====================================================

function esc(
    value
){

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// RANDOM
// =====================================================

function randInt(
    min,
    max
){

    min =
        Math.ceil(
            Number(
                min
            )
        );


    max =
        Math.floor(
            Number(
                max
            )
        );


    return (

        Math.floor(
            Math.random()
            *
            (
                max -
                min +
                1
            )
        )

        +

        min

    );

}


function randomItem(
    array
){

    if(
        !Array.isArray(
            array
        )
        ||
        array.length ===
        0
    ){

        return null;

    }


    return array[
        randInt(
            0,
            array.length -
            1
        )
    ];

}


// =====================================================
// EXPRESS CONFIG
// =====================================================

app.disable(
    "x-powered-by"
);


app.use(
    express.urlencoded({

        extended:
            true

    })
);


app.use(
    express.json({

        limit:
            "1mb"

    })
);


// =====================================================
// SESSION
// =====================================================

app.use(
    session({

        secret:
            process.env.SESSION_SECRET
            ||
            "7BETS_V7_CHANGE_SESSION_SECRET",

        resave:
            false,

        saveUninitialized:
            false,

        cookie:{

            httpOnly:
                true,

            sameSite:
                "lax",

            maxAge:

                1000 *
                60 *
                60 *
                24 *
                7

        }

    })
);


// =====================================================
// CZY ZALOGOWANY
// =====================================================

function logged(
    req
){

    return !!req.session?.userId;

}


// =====================================================
// POBIERZ USERA SESJI
// =====================================================

function getSessionUser(
    req
){

    if(
        !logged(
            req
        )
    ){

        return null;

    }


    const users =
        loadUsers();


    const login =
        String(
            req.session.userId
        );


    let realLogin =
        Object.keys(
            users
        )
        .find(
            name =>
                name.toLowerCase()
                ===
                login.toLowerCase()
        );


    if(
        !realLogin
    ){

        return null;

    }


    const user =
        users[
            realLogin
        ];


    if(
        !user
    ){

        return null;

    }


    ensureStats(
        user,
        realLogin
    );


    return {

        users:
            users,

        login:
            realLogin,

        user:
            user

    };

}


// =====================================================
// KONTO DO GRY
// =====================================================

function requireGameAccount(
    req,
    res
){

    const account =
        getSessionUser(
            req
        );


    if(
        !account
    ){

        res.status(
            401
        )
        .json({

            ok:
                false,

            code:
                "LOGIN_REQUIRED",

            message:
                "Musisz się zalogować."

        });


        return null;

    }


    if(
        account.user.blocked === true
    ){

        res.status(
            403
        )
        .json({

            ok:
                false,

            code:
                "ACCOUNT_BLOCKED",

            message:
                "Twoje konto zostało zablokowane."

        });


        return null;

    }


    if(
        account.user.polaczono !== true
    ){

        res.status(
            403
        )
        .json({

            ok:
                false,

            code:
                "DISCORD_REQUIRED",

            message:
                "Najpierw połącz konto Discord."

        });


        return null;

    }


    return account;

}


// =====================================================
// CZY GRA DOSTĘPNA
// =====================================================

function requireGameAvailable(
    req,
    res,
    game
){

    if(
        isServerMaintenance()
    ){

        res.status(
            503
        )
        .json({

            ok:
                false,

            code:
                "SERVER_MAINTENANCE",

            message:
                "7BETS ma obecnie przerwę techniczną."

        });


        return false;

    }


    if(
        isGameMaintenance(
            game
        )
    ){

        res.status(
            503
        )
        .json({

            ok:
                false,

            code:
                "GAME_MAINTENANCE",

            message:
                "Ta gra ma obecnie przerwę techniczną."

        });


        return false;

    }


    return true;

}


// =====================================================
// SPRAWDZENIE STAWKI
// =====================================================

function validateBet(
    user,
    value
){

    const bet =
        roundMoney(
            value
        );


    if(
        !Number.isFinite(
            bet
        )
        ||
        bet <
        1
    ){

        return {

            ok:
                false,

            message:
                "Minimalna stawka to 1 zł."

        };

    }


    if(
        bet >
        Number(
            user.saldo || 0
        )
    ){

        return {

            ok:
                false,

            message:
                "Masz za mało pieniędzy."

        };

    }


    return {

        ok:
            true,

        bet:
            bet

    };

}


// =====================================================
// STATYSTYKI GRY
// =====================================================

function recordGame(
    user,
    profit,
    field
){

    ensureStats(
        user
    );


    const result =
        roundMoney(
            profit
        );


    user.gry +=
        1;


    if(
        result >
        0
    ){

        user.wygrane +=
            1;


        user.najwiekszaWygrana =
            Math.max(

                Number(
                    user.najwiekszaWygrana || 0
                ),

                result

            );

    }

    else if(
        result <
        0
    ){

        user.przegrane +=
            1;

    }


    if(
        field
    ){

        user[
            field
        ] =
            Number(
                user[
                    field
                ] || 0
            )
            +
            1;

    }

}


// =====================================================
// =====================================================
// NAGRODA CZASOWA
// =====================================================
// =====================================================

function getRewardCooldown(){

    const settings =
        loadSettings();


    const cooldown =
        Number(
            settings.rewardCooldown
        );


    if(
        !Number.isFinite(
            cooldown
        )
        ||
        cooldown <
        1000
    ){

        return (
            5 *
            60 *
            1000
        );

    }


    return cooldown;

}


function getRewardAmount(){

    const settings =
        loadSettings();


    const base =
        roundMoney(
            settings.timedReward ||
            50
        );


    return roundMoney(

        base *
        getMoneyMultiplier()

    );

}


function getRewardRemaining(
    user
){

    ensureStats(
        user
    );


    const last =
        Math.max(

            Number(
                user.ostatniaNagroda || 0
            ),

            Number(
                user.lastReward || 0
            )

        );


    return Math.max(

        0,

        getRewardCooldown()
        -
        (
            Date.now()
            -
            last
        )

    );

}


// =====================================================
// API — EVENTS
// =====================================================
//
// TO BĘDZIE ZASILAĆ
// OKRĄGŁY TIMER W 2/6.
//
// startedAt + endsAt są ważne,
// bo obrys będzie malał z czasem.
//
// =====================================================

app.get(
    "/api/events",
    (
        req,
        res
    ) => {

        const now =
            Date.now();


        const events =
            loadEvents();


        return res.json({

            ok:
                true,

            serverTime:
                now,

            events:
                events.map(
                    event => ({

                        id:
                            event.id,

                        type:
                            event.type,

                        name:
                            event.name,

                        multiplier:
                            Number(
                                event.multiplier || 1
                            ),

                        startedAt:
                            Number(
                                event.startedAt || 0
                            ),

                        endsAt:
                            Number(
                                event.endsAt || 0
                            ),

                        remaining:
                            Math.max(

                                0,

                                Number(
                                    event.endsAt || 0
                                )
                                -
                                now

                            )

                    })
                )

        });

    }
);


// =====================================================
// API — EVENT STATUS
// =====================================================

app.get(
    "/api/event-status",
    (
        req,
        res
    ) => {

        return res.json({

            ok:
                true,

            luck:
                isLuckActive(),

            luckBoost:
                getLuckBoost(),

            moneyMultiplier:
                getMoneyMultiplier(),

            crash:
                isCrashEventActive(),

            crashEvent:
                getCrashEvent()

        });

    }
);


// =====================================================
// API — MAINTENANCE
// =====================================================

app.get(
    "/api/maintenance",
    (
        req,
        res
    ) => {

        const maintenance =
            loadMaintenance();


        return res.json({

            ok:
                true,

            server:
                maintenance.server === true,

            serverStartedAt:
                maintenance.serverStartedAt,

            games:
                maintenance.games || {}

        });

    }
);


// =====================================================
// API — REWARD STATUS
// =====================================================

app.get(
    "/api/reward/status",
    (
        req,
        res
    ) => {

        const account =
            getSessionUser(
                req
            );


        if(
            !account
        ){

            return res.status(
                401
            )
            .json({

                ok:
                    false,

                message:
                    "Musisz się zalogować."

            });

        }


        const settings =
            loadSettings();


        const remaining =
            getRewardRemaining(
                account.user
            );


        return res.json({

            ok:
                true,

            enabled:
                settings.rewardsEnabled === true,

            ready:
                remaining <= 0,

            remaining:
                remaining,

            reward:
                getRewardAmount(),

            cooldown:
                getRewardCooldown(),

            saldo:
                account.user.saldo,

            multiplier:
                getMoneyMultiplier()

        });

    }
);


// =====================================================
// ALIAS — STARA / NOWA NAZWA
// =====================================================

app.get(
    "/api/rewards/status",
    (
        req,
        res
    ) => {

        const account =
            getSessionUser(
                req
            );


        if(
            !account
        ){

            return res.status(
                401
            )
            .json({

                ok:
                    false

            });

        }


        const remaining =
            getRewardRemaining(
                account.user
            );


        return res.json({

            ok:
                true,

            ready:
                remaining <= 0,

            remaining:
                remaining,

            reward:
                getRewardAmount(),

            cooldown:
                getRewardCooldown(),

            saldo:
                account.user.saldo

        });

    }
);


// =====================================================
// API — ODBIERZ NAGRODĘ
// =====================================================
//
// WAŻNE:
//
// ZWRACA:
//
// saldo: user.saldo
//
// Frontend w 2/6 zrobi:
//
// updateBalance(data.saldo)
//
// więc kasa zmienia się OD RAZU.
//
// =====================================================

app.post(
    "/api/reward",
    (
        req,
        res
    ) => {

        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user,
            login

        } =
            account;


        const settings =
            loadSettings();


        if(
            settings.economyEnabled !== true
        ){

            return res.status(
                503
            )
            .json({

                ok:
                    false,

                message:
                    "Ekonomia jest obecnie wyłączona."

            });

        }


        if(
            settings.rewardsEnabled !== true
        ){

            return res.status(
                503
            )
            .json({

                ok:
                    false,

                message:
                    "Nagrody są obecnie wyłączone."

            });

        }


        const remaining =
            getRewardRemaining(
                user
            );


        if(
            remaining >
            0
        ){

            return res.status(
                429
            )
            .json({

                ok:
                    false,

                ready:
                    false,

                remaining:
                    remaining,

                saldo:
                    user.saldo,

                message:
                    "Nagroda nie jest jeszcze dostępna."

            });

        }


        const now =
            Date.now();


        const reward =
            getRewardAmount();


        user.saldo =
            roundMoney(

                user.saldo
                +
                reward

            );


        user.ostatniaNagroda =
            now;


        user.lastReward =
            now;


        notifyUser(

            user,

            "reward",

            "Nagroda odebrana",

            (
                "Otrzymałeś "
                +
                formatMoney(
                    reward
                )
                +
                "."
            )

        );


        saveUsers(
            users
        );


        addLog(

            login,

            "reward",

            login,

            (
                "+"
                +
                formatMoney(
                    reward
                )
            )

        );


        return res.json({

            ok:
                true,

            reward:
                reward,

            multiplier:
                getMoneyMultiplier(),

            // =============================================
            // NAJWAŻNIEJSZE:
            // FRONTEND OD RAZU USTAWIA TO SALDO
            // =============================================

            saldo:
                user.saldo,

            nextAt:
                now +
                getRewardCooldown(),

            remaining:
                getRewardCooldown()

        });

    }
);


// =====================================================
// =====================================================
// BONUS STARTOWY — STATUS
// =====================================================
// =====================================================

app.get(
    "/api/start/status",
    (
        req,
        res
    ) => {

        const account =
            getSessionUser(
                req
            );


        if(
            !account
        ){

            return res.status(
                401
            )
            .json({

                ok:
                    false,

                message:
                    "Musisz się zalogować."

            });

        }


        const settings =
            loadSettings();


        return res.json({

            ok:
                true,

            claimed:
                account.user.startOdebrany === true,

            reward:
                roundMoney(
                    settings.startReward ||
                    200
                ),

            saldo:
                account.user.saldo

        });

    }
);


// =====================================================
// BONUS STARTOWY — ODBIERZ
// =====================================================

app.post(
    "/api/start",
    (
        req,
        res
    ) => {

        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user,
            login

        } =
            account;


        const settings =
            loadSettings();


        if(
            settings.economyEnabled !== true
        ){

            return res.status(
                503
            )
            .json({

                ok:
                    false,

                message:
                    "Ekonomia jest obecnie wyłączona."

            });

        }


        if(
            user.startOdebrany === true
        ){

            return res.status(
                409
            )
            .json({

                ok:
                    false,

                saldo:
                    user.saldo,

                message:
                    "Bonus startowy został już odebrany."

            });

        }


        const reward =
            roundMoney(
                settings.startReward ||
                200
            );


        user.saldo =
            roundMoney(

                user.saldo
                +
                reward

            );


        user.startOdebrany =
            true;


        user.startClaimed =
            true;


        notifyUser(

            user,

            "reward",

            "Bonus startowy",

            (
                "Otrzymałeś "
                +
                formatMoney(
                    reward
                )
                +
                "."
            )

        );


        saveUsers(
            users
        );


        addLog(

            login,

            "start_reward",

            login,

            "+"
            +
            formatMoney(
                reward
            )

        );


        return res.json({

            ok:
                true,

            reward:
                reward,

            // kasa zmieni się od razu
            saldo:
                user.saldo

        });

    }
);


// =====================================================
// =====================================================
// KONIEC POPRAWIONEGO SERVER.JS — 1/6
// =====================================================
//
// 2/6 BĘDZIE MIAŁ:
//
// ✅ STARY GŁÓWNY INTERFACE
//
// ✅ PANEL
// ✅ GRY
// ✅ NAGRODA
// ✅ SKRZYNKI
// ✅ WYLOGUJ
//
// ✅ updateBalance(data.saldo)
//    PO KAŻDEJ ZMIANIE KASY
//
// ✅ OKRĄGŁY EVENT W PRAWYM DOLNYM ROGU
//
// ✅ OUTLINE EVENTU BĘDZIE
//    POWOLI ZNIKAŁ WRAZ Z CZASEM
//
// ✅ PRZERWA TECHNICZNA ZOSTAJE
//    W TYM WYGLĄDZIE KTÓRY CHCIAŁEŚ
//
// ✅ POWIADOMIENIA
// ✅ DŹWIĘKI
// ✅ LOGIN / REGISTER / DISCORD
//
// NIE DODAWAJ app.listen()
//
// =====================================================
// =====================================================
// =====================================================
//                  7BETS SERVER
//                 POPRAWIONY V7
// =====================================================
// =====================================================
//
// SERVER.JS — CZĘŚĆ 2/6
//
// ✅ STARY GŁÓWNY INTERFACE
// ✅ PANEL / GRY / SKRZYNKI / NAGRODA / WYLOGUJ
//
// ✅ SALDO AKTUALIZUJE SIĘ:
//    - po nagrodzie
//    - po grach
//    - po skrzynkach
//    - po zmianie przez BOT.JS
//    - automatycznie co kilka sekund
//
// ✅ OKRĄGŁY EVENT
// ✅ OUTLINE EVENTU POWOLI ZNIKA
// ✅ TIMER EVENTU
//
// ✅ PRZERWA TECHNICZNA:
//    CZARNE TŁO + DUŻA 7 + PASEK
//
// ✅ POWIADOMIENIA
// ✅ DŹWIĘKI
// ✅ LOGIN
// ✅ REGISTER
// ✅ DISCORD LINK
//
// WKLEJ POD 1/6
//
// NIE DODAWAJ JESZCZE app.listen()
//
// =====================================================


// =====================================================
// =====================================================
// GŁÓWNY LAYOUT
// =====================================================
// =====================================================

function layout(
    title,
    content,
    script = ""
){

    return `
<!DOCTYPE html>

<html lang="pl">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width,initial-scale=1"
>

<title>${esc(title)} • 7BETS</title>


<style>

/* =====================================================
   GLOBAL
===================================================== */

*{
    box-sizing:border-box;
}

html{
    scroll-behavior:smooth;
}

:root{

    --bg:#02070b;

    --panel:#071821;
    --panel2:#0a222e;

    --cyan:#5cecff;
    --cyan2:#00bfe8;

    --green:#55f5b3;
    --red:#ff687b;
    --yellow:#ffd166;
    --purple:#b07aff;

    --text:#f0fcff;
    --muted:#78949d;

    --border:
        rgba(92,236,255,.12);

}


body{

    margin:0;

    min-height:100vh;

    font-family:
        "Segoe UI",
        Arial,
        sans-serif;

    color:
        var(--text);

    background:

        radial-gradient(
            circle at 10% 0%,
            rgba(0,210,255,.12),
            transparent 28%
        ),

        radial-gradient(
            circle at 90% 90%,
            rgba(0,100,255,.08),
            transparent 30%
        ),

        linear-gradient(
            145deg,
            #010405,
            #06131c,
            #02070b
        );

}


body::before{

    content:"";

    position:fixed;

    inset:0;

    pointer-events:none;

    z-index:-1;

    background-image:

        linear-gradient(
            rgba(92,236,255,.022) 1px,
            transparent 1px
        ),

        linear-gradient(
            90deg,
            rgba(92,236,255,.022) 1px,
            transparent 1px
        );

    background-size:
        50px 50px;

}


a{

    color:inherit;

    text-decoration:none;

}


/* =====================================================
   SHELL
===================================================== */

.shell{

    width:
        min(
            1280px,
            94%
        );

    margin:auto;

    padding:
        22px 0 70px;

}


/* =====================================================
   TOPBAR
===================================================== */

.topbar{

    min-height:68px;

    display:flex;

    align-items:center;

    justify-content:space-between;

    gap:15px;

    padding:
        11px 15px;

    position:sticky;

    top:12px;

    z-index:50;

    border:
        1px solid
        var(--border);

    border-radius:15px;

    background:
        rgba(3,13,19,.94);

    backdrop-filter:
        blur(18px);

    box-shadow:
        0 12px 40px
        rgba(0,0,0,.28);

}


.brand{

    display:flex;

    align-items:center;

    gap:10px;

}


.brand-mark{

    width:43px;

    height:43px;

    display:grid;

    place-items:center;

    border-radius:11px;

    color:#001015;

    font-size:23px;

    font-weight:1000;

    background:

        linear-gradient(
            135deg,
            #75f5ff,
            #00b4db
        );

    box-shadow:

        0 0 25px
        rgba(0,220,255,.20);

}


.brand-text{

    font-size:20px;

    font-weight:1000;

    letter-spacing:-1px;

}


.brand-text span{

    color:
        var(--cyan);

}


.nav{

    display:flex;

    align-items:center;

    justify-content:center;

    gap:8px;

    flex-wrap:wrap;

}


.nav a{

    padding:
        9px 12px;

    border-radius:8px;

    color:#8ca7af;

    font-size:11px;

    font-weight:800;

    transition:.18s ease;

}


.nav a:hover{

    color:#fff;

    background:
        rgba(92,236,255,.05);

}


.balance-pill{

    min-width:115px;

    padding:
        10px 13px;

    text-align:center;

    border-radius:10px;

    color:
        var(--cyan);

    border:
        1px solid
        rgba(92,236,255,.13);

    background:
        rgba(92,236,255,.045);

    font-size:12px;

    font-weight:1000;

    transition:.25s ease;

}


.balance-pill.balance-changed{

    transform:
        scale(1.08);

    box-shadow:

        0 0 28px
        rgba(92,236,255,.25);

}


/* =====================================================
   BUTTON
===================================================== */

.btn,
button{

    min-height:42px;

    display:inline-flex;

    align-items:center;

    justify-content:center;

    gap:7px;

    padding:
        0 15px;

    border:0;

    border-radius:9px;

    cursor:pointer;

    font-family:inherit;

    color:#001116;

    font-size:11px;

    font-weight:1000;

    background:

        linear-gradient(
            135deg,
            #76f4ff,
            #00bde5
        );

    box-shadow:

        0 8px 25px
        rgba(0,190,230,.10);

    transition:
        .18s ease;

}


.btn:hover,
button:hover{

    transform:
        translateY(-1px);

    filter:
        brightness(1.07);

}


.btn.secondary{

    color:#a6c4cc;

    border:
        1px solid
        rgba(92,236,255,.11);

    background:
        rgba(92,236,255,.04);

    box-shadow:none;

}


button:disabled{

    opacity:.42;

    cursor:not-allowed;

    transform:none;

}


/* =====================================================
   GLASS
===================================================== */

.glass{

    border:
        1px solid
        var(--border);

    border-radius:15px;

    background:

        linear-gradient(
            145deg,
            rgba(10,31,42,.94),
            rgba(4,14,20,.96)
        );

    box-shadow:

        0 25px 80px
        rgba(0,0,0,.22);

}


/* =====================================================
   HERO
===================================================== */

.hero{

    min-height:330px;

    display:flex;

    flex-direction:column;

    justify-content:center;

    padding:
        45px 15px;

}


.eyebrow{

    margin-bottom:9px;

    color:
        var(--cyan);

    font-size:10px;

    font-weight:1000;

    letter-spacing:2px;

    text-transform:uppercase;

}


.hero h1{

    max-width:850px;

    margin:0;

    font-size:
        clamp(
            48px,
            8vw,
            100px
        );

    line-height:.9;

    letter-spacing:-6px;

}


.hero h1 span{

    color:
        var(--cyan);

}


.hero p{

    max-width:600px;

    margin:
        20px 0;

    color:#78949d;

    line-height:1.7;

}


.hero-actions{

    display:flex;

    gap:10px;

    flex-wrap:wrap;

}


/* =====================================================
   DASHBOARD
===================================================== */

.dashboard-grid{

    display:grid;

    grid-template-columns:
        1.5fr .7fr;

    gap:14px;

}


.account-card,
.reward-card{

    padding:22px;

}


.balance-big{

    margin:
        5px 0;

    color:#fff;

    font-size:
        clamp(
            40px,
            6vw,
            70px
        );

    font-weight:1000;

    letter-spacing:-4px;

    transition:.25s ease;

}


.balance-big.balance-changed{

    color:
        var(--cyan);

    transform:
        scale(1.02);

}


.muted{

    color:
        var(--muted);

}


/* =====================================================
   STATUS CHIP
===================================================== */

.status-chip{

    display:inline-flex;

    align-items:center;

    gap:7px;

    padding:
        7px 10px;

    border-radius:999px;

    font-size:10px;

    font-weight:900;

}


.status-chip.on{

    color:
        var(--green);

    border:
        1px solid
        rgba(85,245,179,.16);

    background:
        rgba(85,245,179,.06);

}


.status-chip.off{

    color:
        var(--red);

    border:
        1px solid
        rgba(255,104,123,.16);

    background:
        rgba(255,104,123,.06);

}


/* =====================================================
   MINI STATS
===================================================== */

.mini-stats{

    display:grid;

    grid-template-columns:
        repeat(
            4,
            1fr
        );

    gap:8px;

    margin-top:19px;

}


.mini{

    min-height:80px;

    padding:13px;

    border-radius:11px;

    background:
        rgba(255,255,255,.022);

    border:
        1px solid
        rgba(255,255,255,.04);

}


.mini small{

    display:block;

    margin-bottom:7px;

    color:#69868f;

}


.mini strong{

    font-size:19px;

}


/* =====================================================
   REWARD
===================================================== */

.timer{

    margin:
        13px 0;

    color:
        var(--cyan);

    font-size:37px;

    font-weight:1000;

}


/* =====================================================
   SECTION
===================================================== */

.section{

    margin-top:23px;

}


.section-head{

    display:flex;

    justify-content:space-between;

    align-items:flex-end;

    gap:15px;

    margin-bottom:13px;

}


/* =====================================================
   GAME GRID
===================================================== */

.game-grid{

    display:grid;

    grid-template-columns:

        repeat(
            auto-fit,
            minmax(
                220px,
                1fr
            )
        );

    gap:13px;

}


.game-card{

    min-height:240px;

    display:flex;

    flex-direction:column;

    position:relative;

    overflow:hidden;

    padding:20px;

    border-radius:15px;

    border:
        1px solid
        var(--border);

    background:

        linear-gradient(
            150deg,
            #0a202b,
            #06131b
        );

    transition:
        .2s ease;

}


.game-card:hover{

    transform:
        translateY(-3px);

    border-color:
        rgba(92,236,255,.27);

    box-shadow:

        0 15px 50px
        rgba(0,0,0,.25);

}


.game-icon{

    width:54px;

    height:54px;

    display:grid;

    place-items:center;

    border-radius:13px;

    font-size:30px;

    background:
        rgba(92,236,255,.05);

}


.game-card h3{

    margin:
        15px 0 0;

}


.game-card p{

    color:#77929b;

    line-height:1.55;

    font-size:12px;

}


.game-meta{

    display:flex;

    justify-content:space-between;

    gap:10px;

    margin-top:auto;

    padding:
        15px 0 12px;

    color:#6b8790;

    font-size:10px;

}


.lock-overlay{

    position:absolute;

    inset:0;

    display:grid;

    place-items:center;

    text-align:center;

    background:
        rgba(2,8,12,.82);

    backdrop-filter:
        blur(5px);

}


/* =====================================================
   AUTH
===================================================== */

.auth-wrap{

    width:
        min(
            1080px,
            94%
        );

    min-height:100vh;

    margin:auto;

    display:grid;

    grid-template-columns:
        1.1fr .9fr;

    gap:30px;

    align-items:center;

}


.auth-showcase{

    padding:30px;

}


.auth-showcase h1{

    margin:0;

    font-size:
        clamp(
            44px,
            7vw,
            80px
        );

    line-height:.94;

    letter-spacing:-4px;

}


.auth-showcase h1 span{

    color:
        var(--cyan);

}


.auth-showcase p{

    color:#7c98a1;

    line-height:1.75;

}


.auth-card{

    padding:29px;

}


.auth-logo{

    display:flex;

    align-items:center;

    gap:10px;

    margin-bottom:25px;

    font-size:20px;

    font-weight:1000;

}


.auth-mega-logo{

    position:relative;

    display:inline-block;

    margin:
        0 0 20px;

    font-size:

        clamp(
            78px,
            12vw,
            155px
        );

    line-height:.78;

    font-weight:1000;

    letter-spacing:-10px;

    color:#fff;

}


.auth-mega-logo span{

    color:
        var(--cyan);

    text-shadow:

        0 0 30px
        rgba(92,236,255,.35);

}


.logo-subtitle{

    margin-bottom:20px;

    color:
        var(--cyan);

    font-size:11px;

    font-weight:1000;

    letter-spacing:4px;

}


/* =====================================================
   FORM
===================================================== */

.field{

    margin-bottom:15px;

}


label{

    display:block;

    margin-bottom:7px;

    color:#78959e;

    font-size:10px;

    font-weight:900;

    text-transform:uppercase;

}


input,
select{

    width:100%;

    height:45px;

    padding:
        0 13px;

    border-radius:9px;

    outline:0;

    border:
        1px solid
        rgba(92,236,255,.13);

    background:#041018;

    color:#fff;

}


input:focus,
select:focus{

    border-color:
        rgba(92,236,255,.40);

    box-shadow:

        0 0 0 3px
        rgba(92,236,255,.035);

}


/* =====================================================
   ALERT
===================================================== */

.alert{

    padding:
        12px 14px;

    margin-top:13px;

    border-radius:10px;

}


.alert.bad{

    color:
        var(--red);

    border:
        1px solid
        rgba(255,104,123,.16);

    background:
        rgba(255,104,123,.06);

}


.alert.ok{

    color:
        var(--green);

    border:
        1px solid
        rgba(85,245,179,.16);

    background:
        rgba(85,245,179,.06);

}


/* =====================================================
   POWIADOMIENIA
===================================================== */

.notification-stack{

    position:fixed;

    top:18px;

    right:18px;

    z-index:99999;

    width:

        min(
            390px,
            calc(
                100vw - 28px
            )
        );

    display:flex;

    flex-direction:column;

    gap:10px;

    pointer-events:none;

}


.notify-card{

    position:relative;

    overflow:hidden;

    display:grid;

    grid-template-columns:
        44px 1fr 28px;

    gap:11px;

    align-items:center;

    padding:13px;

    border-radius:14px;

    border:
        1px solid
        rgba(92,236,255,.16);

    background:

        linear-gradient(
            145deg,
            rgba(8,26,35,.98),
            rgba(3,12,17,.98)
        );

    box-shadow:

        0 18px 50px
        rgba(0,0,0,.38);

    pointer-events:auto;

    animation:

        notifyIn
        .32s
        cubic-bezier(
            .2,
            .8,
            .2,
            1
        );

}


.notify-card.success{

    border-color:
        rgba(85,245,179,.24);

}


.notify-card.error{

    border-color:
        rgba(255,104,123,.26);

}


.notify-card.admin{

    border-color:
        rgba(176,122,255,.28);

}


.notify-icon{

    width:44px;

    height:44px;

    display:grid;

    place-items:center;

    border-radius:12px;

    font-size:22px;

    background:
        rgba(92,236,255,.07);

}


.notify-title{

    font-size:13px;

    font-weight:1000;

    color:#fff;

}


.notify-text{

    margin-top:3px;

    color:#89a3ab;

    font-size:11px;

    line-height:1.45;

}


.notify-close{

    width:28px;

    height:28px;

    min-height:28px;

    padding:0;

    border-radius:8px;

    color:#7f98a0;

    background:
        rgba(255,255,255,.035);

    box-shadow:none;

}


.notify-progress{

    position:absolute;

    left:0;

    bottom:0;

    width:100%;

    height:2px;

    transform-origin:left;

    background:
        var(--cyan);

    animation:

        notifyProgress
        4.5s
        linear
        forwards;

}


.notify-card.success
.notify-progress{

    background:
        var(--green);

}


.notify-card.error
.notify-progress{

    background:
        var(--red);

}


.notify-card.hide{

    animation:
        notifyOut
        .25s
        ease
        forwards;

}


@keyframes notifyIn{

    from{

        opacity:0;

        transform:
            translateX(35px)
            scale(.97);

    }

}


@keyframes notifyOut{

    to{

        opacity:0;

        transform:
            translateX(35px)
            scale(.97);

    }

}


@keyframes notifyProgress{

    from{

        transform:
            scaleX(1);

    }

    to{

        transform:
            scaleX(0);

    }

}


/* =====================================================
   EVENT — OKRĄGŁY TIMER
===================================================== */

.event-widget{

    position:fixed;

    right:24px;

    bottom:24px;

    z-index:8000;

    width:136px;

    display:none;

    flex-direction:column;

    align-items:center;

    justify-content:center;

    animation:
        eventAppear
        .35s
        ease;

}


.event-widget.visible{

    display:flex;

}


.event-ring-box{

    width:132px;

    height:132px;

    position:relative;

    display:grid;

    place-items:center;

    filter:

        drop-shadow(
            0 0 12px
            rgba(92,236,255,.30)
        );

}


.event-ring-box svg{

    position:absolute;

    inset:0;

    width:132px;

    height:132px;

    transform:
        rotate(-90deg);

}


.event-ring-bg{

    fill:none;

    stroke:
        rgba(92,236,255,.11);

    stroke-width:6;

}


.event-ring-progress{

    fill:none;

    stroke:
        url(#eventGradient);

    stroke-width:6;

    stroke-linecap:round;

    transition:

        stroke-dashoffset
        .6s linear;

}


.event-center{

    width:102px;

    height:102px;

    position:relative;

    z-index:2;

    display:flex;

    flex-direction:column;

    align-items:center;

    justify-content:center;

    text-align:center;

    border-radius:50%;

    border:
        1px solid
        rgba(92,236,255,.12);

    background:

        radial-gradient(
            circle,
            rgba(10,35,55,.96),
            rgba(3,15,25,.98)
        );

    box-shadow:

        inset 0 0 30px
        rgba(0,190,255,.07);

}


.event-lightning{

    margin-bottom:3px;

    font-size:15px;

}


.event-name{

    max-width:88px;

    color:#fff;

    font-size:11px;

    font-weight:1000;

    line-height:1.1;

    text-transform:uppercase;

    overflow:hidden;

    text-overflow:ellipsis;

    white-space:nowrap;

}


.event-time{

    margin-top:5px;

    color:
        var(--cyan);

    font-size:17px;

    font-weight:1000;

    letter-spacing:.5px;

}


.event-count{

    margin-top:5px;

    color:#6d94a7;

    font-size:9px;

    font-weight:900;

    text-transform:uppercase;

}


.event-widget.ending
.event-ring-box{

    animation:

        eventPulse
        .8s
        infinite
        alternate;

}


@keyframes eventPulse{

    from{

        filter:

            drop-shadow(
                0 0 8px
                rgba(92,236,255,.20)
            );

    }


    to{

        filter:

            drop-shadow(
                0 0 24px
                rgba(92,236,255,.70)
            );

    }

}


@keyframes eventAppear{

    from{

        opacity:0;

        transform:
            translateY(20px)
            scale(.85);

    }


    to{

        opacity:1;

        transform:
            translateY(0)
            scale(1);

    }

}


/* =====================================================
   PRZERWA TECHNICZNA
===================================================== */

.maintenance-screen{

    position:fixed;

    inset:0;

    z-index:999999;

    display:none;

    align-items:center;

    justify-content:center;

    padding:30px;

    text-align:center;

    background:#010305;

}


.maintenance-screen.active{

    display:flex;

}


.maintenance-content{

    width:
        min(
            620px,
            100%
        );

}


.maintenance-seven{

    color:
        var(--cyan);

    font-size:
        clamp(
            90px,
            15vw,
            150px
        );

    font-weight:1000;

    line-height:.8;

    text-shadow:

        0 0 60px
        rgba(92,236,255,.25);

}


.maintenance-content h1{

    margin:
        30px 0 0;

    font-size:
        clamp(
            27px,
            6vw,
            42px
        );

}


.maintenance-content p{

    margin-top:13px;

    color:#667b86;

    line-height:1.7;

}


.maintenance-loader{

    width:220px;

    height:3px;

    margin:
        30px auto 0;

    overflow:hidden;

    border-radius:999px;

    background:
        rgba(255,255,255,.06);

}


.maintenance-loader div{

    width:40%;

    height:100%;

    background:
        var(--cyan);

    box-shadow:

        0 0 17px
        rgba(92,236,255,.5);

    animation:

        maintenanceMove
        1.4s
        ease-in-out
        infinite;

}


@keyframes maintenanceMove{

    0%{

        transform:
            translateX(-140%);

    }

    100%{

        transform:
            translateX(360%);

    }

}


/* =====================================================
   RESPONSIVE
===================================================== */

@media(max-width:850px){

    .dashboard-grid{

        grid-template-columns:
            1fr;

    }


    .auth-wrap{

        grid-template-columns:
            1fr;

        padding:
            50px 0;

    }

}


@media(max-width:600px){

    .topbar{

        position:relative;

        top:0;

        flex-direction:column;

        align-items:stretch;

    }


    .nav{

        justify-content:center;

    }


    .balance-pill{

        width:100%;

    }


    .hero h1{

        letter-spacing:-3px;

    }


    .mini-stats{

        grid-template-columns:
            repeat(
                2,
                1fr
            );

    }


    .notification-stack{

        top:10px;

        right:10px;

        width:
            calc(
                100vw - 20px
            );

    }


    .event-widget{

        right:12px;

        bottom:12px;

        transform:
            scale(.88);

        transform-origin:
            bottom right;

    }

}

</style>

</head>


<body>


<!-- =================================================
     POWIADOMIENIA
================================================== -->

<div
    id="notificationStack"
    class="notification-stack"
></div>


<!-- =================================================
     OKRĄGŁY EVENT
================================================== -->

<div
    id="eventWidget"
    class="event-widget"
>

    <div class="event-ring-box">


        <svg viewBox="0 0 132 132">


            <defs>

                <linearGradient
                    id="eventGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >

                    <stop
                        offset="0%"
                        stop-color="#76f4ff"
                    />

                    <stop
                        offset="100%"
                        stop-color="#0099ff"
                    />

                </linearGradient>

            </defs>


            <circle
                class="event-ring-bg"
                cx="66"
                cy="66"
                r="58"
            ></circle>


            <circle
                id="eventRingProgress"
                class="event-ring-progress"
                cx="66"
                cy="66"
                r="58"
            ></circle>


        </svg>


        <div class="event-center">


            <div class="event-lightning">
                ⚡
            </div>


            <div
                id="eventName"
                class="event-name"
            >
                EVENT
            </div>


            <div
                id="eventTime"
                class="event-time"
            >
                00:00
            </div>


        </div>


    </div>


    <div
        id="eventCount"
        class="event-count"
    >
        AKTYWNY EVENT
    </div>


</div>


<!-- =================================================
     PRZERWA TECHNICZNA
================================================== -->

<div
    class="maintenance-screen"
    id="maintenanceScreen"
>

    <div class="maintenance-content">


        <div class="maintenance-seven">
            7
        </div>


        <h1>
            PRZERWA TECHNICZNA
        </h1>


        <p>

            7BETS jest obecnie niedostępne.

            <br>

            Przepraszamy za utrudnienia.

        </p>


        <div class="maintenance-loader">

            <div></div>

        </div>


    </div>

</div>


${content}


<script>

// =====================================================
// =====================================================
// MONEY FRONTEND
// =====================================================
// =====================================================

function money(
    value
){

    return (

        new Intl.NumberFormat(
            "pl-PL",
            {

                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2

            }
        )
        .format(
            Number(
                value || 0
            )
        )

        +

        " zł"

    );

}


// =====================================================
// =====================================================
// GLOBALNE SALDO
// =====================================================
// =====================================================
//
// KAŻDY ELEMENT Z:
//
// data-balance
//
// DOSTAJE NOWE SALDO.
//
// =====================================================

let currentDisplayedBalance =
    null;


function updateBalance(
    value
){

    const number =
        Number(
            value
        );


    if(
        !Number.isFinite(
            number
        )
    ){

        return;

    }


    const changed =
        currentDisplayedBalance !==
        null

        &&

        Math.abs(
            currentDisplayedBalance -
            number
        )
        >
        .001;


    currentDisplayedBalance =
        number;


    document
        .querySelectorAll(
            "[data-balance]"
        )
        .forEach(
            element => {

                element.textContent =
                    money(
                        number
                    );


                if(
                    changed
                ){

                    element.classList.add(
                        "balance-changed"
                    );


                    setTimeout(
                        () => {

                            element.classList.remove(
                                "balance-changed"
                            );

                        },
                        450
                    );

                }

            }
        );

}


// =====================================================
// =====================================================
// AUDIO
// =====================================================
// =====================================================

let audioContext7BETS =
    null;


function getAudioContext7BETS(){

    try{

        if(
            !audioContext7BETS
        ){

            const AudioContextClass =

                window.AudioContext

                ||

                window.webkitAudioContext;


            if(
                !AudioContextClass
            ){

                return null;

            }


            audioContext7BETS =
                new AudioContextClass();

        }


        if(
            audioContext7BETS.state ===
            "suspended"
        ){

            audioContext7BETS
                .resume()
                .catch(
                    () => {}
                );

        }


        return audioContext7BETS;

    }

    catch{

        return null;

    }

}


// =====================================================
// TONE
// =====================================================

function soundTone(
    frequency,
    duration = .07,
    volume = .025,
    type = "sine",
    delay = 0
){

    try{

        const context =
            getAudioContext7BETS();


        if(
            !context
        ){

            return;

        }


        const oscillator =
            context.createOscillator();


        const gain =
            context.createGain();


        const start =
            context.currentTime +
            delay;


        oscillator.type =
            type;


        oscillator.frequency
            .setValueAtTime(
                frequency,
                start
            );


        gain.gain
            .setValueAtTime(
                .0001,
                start
            );


        gain.gain
            .exponentialRampToValueAtTime(

                Math.max(
                    .0001,
                    volume
                ),

                start +
                .008

            );


        gain.gain
            .exponentialRampToValueAtTime(

                .0001,

                start +
                duration

            );


        oscillator.connect(
            gain
        );


        gain.connect(
            context.destination
        );


        oscillator.start(
            start
        );


        oscillator.stop(
            start +
            duration +
            .02
        );

    }

    catch{}

}


// =====================================================
// UI SOUND
// =====================================================

function playUiSound(
    type
){

    if(
        type ===
        "click"
    ){

        soundTone(
            420,
            .055,
            .014,
            "square"
        );


        return;

    }


    if(
        type ===
        "success"
    ){

        soundTone(
            540,
            .08,
            .022
        );


        soundTone(
            760,
            .12,
            .020,
            "sine",
            .065
        );


        return;

    }


    if(
        type ===
        "error"
    ){

        soundTone(
            190,
            .16,
            .020,
            "sawtooth"
        );


        return;

    }


    if(
        type ===
        "notify"
    ){

        soundTone(
            680,
            .08,
            .015
        );

    }

}


// =====================================================
// KLIKNIĘCIA
// =====================================================

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "button,.btn,.nav a,.game-card a"
            );


        if(
            button
        ){

            playUiSound(
                "click"
            );

        }

    }
);


// =====================================================
// =====================================================
// POWIADOMIENIA
// =====================================================
// =====================================================

function showNotification(
    type,
    title,
    message,
    duration = 4500
){

    const stack =
        document.getElementById(
            "notificationStack"
        );


    if(
        !stack
    ){

        return;

    }


    let icon =
        "🔔";


    if(
        type === "success"
        ||
        type === "reward"
        ||
        type === "win"
        ||
        type === "discord"
    ){

        icon =
            type === "reward"
                ?
                "🎁"
                :
                type === "win"
                    ?
                    "💰"
                    :
                    type === "discord"
                        ?
                        "🔗"
                        :
                        "✓";

    }


    if(
        type === "error"
        ||
        type === "loss"
    ){

        icon =
            type === "loss"
                ?
                "💥"
                :
                "✕";

    }


    if(
        type === "admin"
    ){

        icon =
            "🛡️";

    }


    if(
        type === "event"
    ){

        icon =
            "⚡";

    }


    let visualType =
        type;


    if(
        [
            "reward",
            "win",
            "discord"
        ]
        .includes(
            visualType
        )
    ){

        visualType =
            "success";

    }


    if(
        visualType ===
        "loss"
    ){

        visualType =
            "error";

    }


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "notify-card "
        +
        visualType;


    const iconElement =
        document.createElement(
            "div"
        );


    iconElement.className =
        "notify-icon";


    iconElement.textContent =
        icon;


    const body =
        document.createElement(
            "div"
        );


    const titleElement =
        document.createElement(
            "div"
        );


    titleElement.className =
        "notify-title";


    titleElement.textContent =
        title ||
        "7BETS";


    const textElement =
        document.createElement(
            "div"
        );


    textElement.className =
        "notify-text";


    textElement.textContent =
        message ||
        "";


    body.appendChild(
        titleElement
    );


    body.appendChild(
        textElement
    );


    const close =
        document.createElement(
            "button"
        );


    close.className =
        "notify-close";


    close.type =
        "button";


    close.textContent =
        "×";


    const progress =
        document.createElement(
            "div"
        );


    progress.className =
        "notify-progress";


    progress.style.animationDuration =
        duration +
        "ms";


    card.appendChild(
        iconElement
    );


    card.appendChild(
        body
    );


    card.appendChild(
        close
    );


    card.appendChild(
        progress
    );


    stack.appendChild(
        card
    );


    if(
        visualType ===
        "success"
    ){

        playUiSound(
            "success"
        );

    }

    else if(
        visualType ===
        "error"
    ){

        playUiSound(
            "error"
        );

    }

    else{

        playUiSound(
            "notify"
        );

    }


    function remove(){

        if(
            card.classList.contains(
                "hide"
            )
        ){

            return;

        }


        card.classList.add(
            "hide"
        );


        setTimeout(
            () => {

                card.remove();

            },
            260
        );

    }


    close.addEventListener(
        "click",
        remove
    );


    setTimeout(
        remove,
        duration
    );

}


// =====================================================
// =====================================================
// FETCH API
// =====================================================
// =====================================================

async function api(
    url,
    options = {}
){

    try{

        const config = {

            ...options,

            headers:{

                ...(
                    options.body
                        ?
                        {
                            "Content-Type":
                                "application/json"
                        }
                        :
                        {}
                ),

                ...(
                    options.headers ||
                    {}
                )

            }

        };


        const response =
            await fetch(
                url,
                config
            );


        let data = {};


        try{

            data =
                await response.json();

        }

        catch{

            data = {

                ok:false,

                message:
                    "Serwer zwrócił nieprawidłową odpowiedź."

            };

        }


        return {

            response,
            data

        };

    }

    catch(error){

        return {

            response:null,

            data:{

                ok:false,

                message:
                    "Brak połączenia z serwerem."

            }

        };

    }

}


// =====================================================
// =====================================================
// AUTOMATYCZNA SYNCHRONIZACJA SALDA
// =====================================================
// =====================================================
//
// JEŻELI:
//
// - BOT DA KOMUŚ KASĘ
// - BOT ZABIERZE KASĘ
// - ADMIN USTAWI SALDO
//
// STRONA SAMA ZOBACZY NOWĄ KWOTĘ.
//
// =====================================================

let balanceSyncRunning =
    false;


async function refreshBalance(){

    if(
        balanceSyncRunning
    ){

        return;

    }


    balanceSyncRunning =
        true;


    try{

        const response =
            await fetch(
                "/api/me",
                {
                    cache:
                        "no-store"
                }
            );


        if(
            !response.ok
        ){

            return;

        }


        const data =
            await response.json();


        if(
            data.ok
            &&
            Number.isFinite(
                Number(
                    data.saldo
                )
            )
        ){

            updateBalance(
                data.saldo
            );

        }

    }

    catch{}

    finally{

        balanceSyncRunning =
            false;

    }

}


setTimeout(
    refreshBalance,
    350
);


setInterval(
    refreshBalance,
    2500
);


// =====================================================
// =====================================================
// MAINTENANCE
// =====================================================
// =====================================================

let maintenanceWasActive =
    false;


async function checkMaintenance(){

    try{

        const response =
            await fetch(
                "/api/maintenance",
                {
                    cache:"no-store"
                }
            );


        if(
            !response.ok
        ){

            return;

        }


        const data =
            await response.json();


        const screen =
            document.getElementById(
                "maintenanceScreen"
            );


        if(
            !screen
        ){

            return;

        }


        const active =
            data.server ===
            true;


        screen.classList.toggle(
            "active",
            active
        );


        if(
            maintenanceWasActive
            &&
            !active
        ){

            showNotification(

                "success",

                "7BETS ONLINE",

                "Przerwa techniczna została zakończona."

            );

        }


        maintenanceWasActive =
            active;

    }

    catch{}

}


checkMaintenance();


setInterval(
    checkMaintenance,
    3000
);


// =====================================================
// =====================================================
// EVENT — OKRĄGŁY TIMER
// =====================================================
// =====================================================

const EVENT_RADIUS =
    58;


const EVENT_CIRCUMFERENCE =
    2 *
    Math.PI *
    EVENT_RADIUS;


const eventRing =
    document.getElementById(
        "eventRingProgress"
    );


if(
    eventRing
){

    eventRing.style.strokeDasharray =
        EVENT_CIRCUMFERENCE;


    eventRing.style.strokeDashoffset =
        0;

}


let eventData =
    [];


let eventServerOffset =
    0;


// =====================================================
// FORMAT CZASU
// =====================================================

function formatEventCountdown(
    ms
){

    if(
        !Number.isFinite(
            Number(
                ms
            )
        )
    ){

        return "∞";

    }


    const totalSeconds =
        Math.max(

            0,

            Math.ceil(
                ms /
                1000
            )

        );


    const hours =
        Math.floor(
            totalSeconds /
            3600
        );


    const minutes =
        Math.floor(
            (
                totalSeconds %
                3600
            )
            /
            60
        );


    const seconds =
        totalSeconds %
        60;


    if(
        hours >
        0
    ){

        return (

            String(
                hours
            )

            +

            ":"

            +

            String(
                minutes
            )
            .padStart(
                2,
                "0"
            )

            +

            ":"

            +

            String(
                seconds
            )
            .padStart(
                2,
                "0"
            )

        );

    }


    return (

        String(
            minutes
        )
        .padStart(
            2,
            "0"
        )

        +

        ":"

        +

        String(
            seconds
        )
        .padStart(
            2,
            "0"
        )

    );

}


// =====================================================
// RENDER EVENTU
// =====================================================

function renderEventTimer(){

    const widget =
        document.getElementById(
            "eventWidget"
        );


    const name =
        document.getElementById(
            "eventName"
        );


    const time =
        document.getElementById(
            "eventTime"
        );


    const count =
        document.getElementById(
            "eventCount"
        );


    if(
        !widget
        ||
        !name
        ||
        !time
        ||
        !count
        ||
        !eventRing
    ){

        return;

    }


    const now =
        Date.now()
        +
        eventServerOffset;


    eventData =
        eventData.filter(
            event => {

                const endsAt =
                    Number(
                        event.endsAt || 0
                    );


                return (
                    endsAt <= 0
                    ||
                    endsAt > now
                );

            }
        );


    if(
        eventData.length ===
        0
    ){

        widget.classList.remove(
            "visible"
        );


        widget.classList.remove(
            "ending"
        );


        return;

    }


    // EVENT KOŃCZĄCY SIĘ NAJWCZEŚNIEJ

    const timedEvents =
        eventData.filter(
            event =>
                Number(
                    event.endsAt || 0
                )
                >
                0
        );


    const event =
        timedEvents.length

            ?

            [...timedEvents]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        Number(
                            a.endsAt
                        )
                        -
                        Number(
                            b.endsAt
                        )
                )[0]

            :

            eventData[0];


    const endsAt =
        Number(
            event.endsAt || 0
        );


    const startedAt =
        Number(
            event.startedAt || 0
        );


    if(
        endsAt >
        0
    ){

        const remaining =
            Math.max(

                0,

                endsAt -
                now

            );


        const totalDuration =
            Math.max(

                1,

                endsAt -
                startedAt

            );


        // =============================================
        // PROCENT POZOSTAŁEGO EVENTU
        // =============================================

        const progress =
            Math.max(

                0,

                Math.min(

                    1,

                    remaining /
                    totalDuration

                )

            );


        // =============================================
        // OUTLINE POWOLI ZNIKA
        // =============================================

        eventRing.style.strokeDashoffset =

            EVENT_CIRCUMFERENCE
            *
            (
                1 -
                progress
            );


        time.textContent =
            formatEventCountdown(
                remaining
            );


        if(
            remaining <=
            60000
        ){

            widget.classList.add(
                "ending"
            );

        }

        else{

            widget.classList.remove(
                "ending"
            );

        }

    }

    else{

        eventRing.style.strokeDashoffset =
            0;


        time.textContent =
            "∞";


        widget.classList.remove(
            "ending"
        );

    }


    name.textContent =
        event.name
        ||
        event.type
        ||
        "EVENT";


    count.textContent =

        eventData.length >
        1

            ?

            "+"
            +
            (
                eventData.length -
                1
            )
            +
            " EVENTY"

            :

            "AKTYWNY EVENT";


    widget.classList.add(
        "visible"
    );

}


// =====================================================
// POBIERANIE EVENTÓW
// =====================================================

async function refreshEvents(){

    try{

        const response =
            await fetch(
                "/api/events",
                {
                    cache:
                        "no-store"
                }
            );


        const data =
            await response.json();


        if(
            !data.ok
            ||
            !Array.isArray(
                data.events
            )
        ){

            return;

        }


        eventServerOffset =

            Number(
                data.serverTime ||
                Date.now()
            )

            -

            Date.now();


        eventData =
            data.events;


        renderEventTimer();

    }

    catch{}

}


setInterval(
    renderEventTimer,
    500
);


setInterval(
    refreshEvents,
    2500
);


setTimeout(
    refreshEvents,
    250
);


// =====================================================
// =====================================================
// POWIADOMIENIA Z BOT.JS / SERWERA
// =====================================================
// =====================================================

let notificationChecking =
    false;


async function checkNotifications(){

    if(
        notificationChecking
    ){

        return;

    }


    notificationChecking =
        true;


    try{

        const response =
            await fetch(
                "/api/notifications",
                {
                    cache:
                        "no-store"
                }
            );


        if(
            !response.ok
        ){

            return;

        }


        const data =
            await response.json();


        if(
            !data.ok
            ||
            !Array.isArray(
                data.notifications
            )
        ){

            return;

        }


        for(
            const notification
            of data.notifications
        ){

            showNotification(

                notification.type ||
                "info",

                notification.title ||
                "7BETS",

                notification.message ||
                ""

            );

        }

    }

    catch{}

    finally{

        notificationChecking =
            false;

    }

}


setTimeout(
    checkNotifications,
    800
);


setInterval(
    checkNotifications,
    3000
);


// =====================================================
// DODATKOWY JS STRONY
// =====================================================

${script}

</script>

</body>

</html>
`;

}


// =====================================================
// =====================================================
// TOPBAR
// =====================================================
// =====================================================

function topbar(
    user
){

    ensureStats(
        user
    );


    return `

<div class="topbar">


    <a
        href="/panel"
        class="brand"
    >

        <div class="brand-mark">
            7
        </div>

        <div class="brand-text">
            <span>7</span>BETS
        </div>

    </a>


    <div class="nav">


        <a href="/panel">
            🏠 PANEL
        </a>


        <a href="/panel#games">
            🎮 GRY
        </a>


        <a href="/crates">
            📦 SKRZYNKI
        </a>


        <a href="/panel#reward">
            🎁 NAGRODA
        </a>


        <a href="/logout">
            🚪 WYLOGUJ
        </a>


    </div>


    <div
        class="balance-pill"
        data-balance
    >
        ${formatMoney(
            user.saldo
        )}
    </div>


</div>

`;

}


// =====================================================
// =====================================================
// LOGIN PAGE
// =====================================================
// =====================================================

function loginPage(
    message = "",
    type = ""
){

    const alert =
        message
            ?
            `

<div class="alert ${type}">
    ${esc(message)}
</div>

`
            :
            "";


    return layout(

        "Logowanie",

        `

<div class="auth-wrap">


    <section class="auth-showcase">


        <div class="logo-subtitle">
            PLAY • WIN • REPEAT
        </div>


        <div class="auth-mega-logo">

            <span>7</span>BETS

        </div>


        <h1>

            Graj.

            <br>

            <span>
                Wygrywaj.
            </span>

        </h1>


        <p>

            Wirtualne gry,
            eventy,
            nagrody,
            Discord
            i własne saldo 7BETS.

        </p>


    </section>


    <section class="glass auth-card">


        <div class="auth-logo">


            <div class="brand-mark">
                7
            </div>


            <div>
                7BETS
            </div>


        </div>


        <h2>
            Witaj 👋
        </h2>


        <p class="muted">
            Zaloguj się do swojego konta.
        </p>


        <form
            method="POST"
            action="/login"
            style="margin-top:20px"
        >


            <div class="field">

                <label>
                    LOGIN
                </label>

                <input
                    name="login"
                    maxlength="30"
                    autocomplete="username"
                    required
                >

            </div>


            <div class="field">

                <label>
                    HASŁO
                </label>

                <input
                    name="password"
                    type="password"
                    maxlength="100"
                    autocomplete="current-password"
                    required
                >

            </div>


            <button
                type="submit"
                style="width:100%"
            >
                ZALOGUJ SIĘ
            </button>


        </form>


        ${alert}


        <p
            class="muted"
            style="
                text-align:center;
                margin-top:20px
            "
        >

            Nie masz konta?

            <a
                href="/register"
                style="
                    color:var(--cyan);
                    font-weight:900
                "
            >
                Utwórz konto
            </a>

        </p>


    </section>


</div>

`

    );

}


// =====================================================
// =====================================================
// REGISTER PAGE
// =====================================================
// =====================================================

function registerPage(
    message = "",
    type = ""
){

    const alert =
        message
            ?
            `

<div class="alert ${type}">
    ${esc(message)}
</div>

`
            :
            "";


    return layout(

        "Rejestracja",

        `

<div class="auth-wrap">


    <section class="auth-showcase">


        <div class="logo-subtitle">
            JOIN • PLAY • WIN
        </div>


        <div class="auth-mega-logo">

            <span>7</span>BETS

        </div>


        <h1>

            Dołącz.

            <br>

            <span>
                Graj.
            </span>

        </h1>


        <p>

            Utwórz konto,
            połącz Discord
            i odblokuj system 7BETS.

        </p>


    </section>


    <section class="glass auth-card">


        <div class="auth-logo">

            <div class="brand-mark">
                7
            </div>

            7BETS

        </div>


        <h2>
            Utwórz konto
        </h2>


        <form
            method="POST"
            action="/register"
            style="margin-top:20px"
        >


            <div class="field">

                <label>
                    LOGIN
                </label>

                <input
                    name="login"
                    maxlength="30"
                    required
                >

            </div>


            <div class="field">

                <label>
                    HASŁO
                </label>

                <input
                    name="password"
                    type="password"
                    minlength="6"
                    maxlength="100"
                    required
                >

            </div>


            <button
                type="submit"
                style="width:100%"
            >
                UTWÓRZ KONTO
            </button>


        </form>


        ${alert}


        <p
            class="muted"
            style="
                text-align:center;
                margin-top:20px
            "
        >

            Masz już konto?

            <a
                href="/login"
                style="
                    color:var(--cyan);
                    font-weight:900
                "
            >
                Zaloguj się
            </a>

        </p>


    </section>


</div>

`

    );

}


// =====================================================
// =====================================================
// START
// =====================================================
// =====================================================

app.get(
    "/",
    (
        req,
        res
    ) => {

        if(
            logged(
                req
            )
        ){

            return res.redirect(
                "/panel"
            );

        }


        return res.redirect(
            "/login"
        );

    }
);


// =====================================================
// LOGIN GET
// =====================================================

app.get(
    "/login",
    (
        req,
        res
    ) => {

        if(
            logged(
                req
            )
        ){

            return res.redirect(
                "/panel"
            );

        }


        return res.send(
            loginPage()
        );

    }
);


// =====================================================
// REGISTER GET
// =====================================================

app.get(
    "/register",
    (
        req,
        res
    ) => {

        if(
            logged(
                req
            )
        ){

            return res.redirect(
                "/panel"
            );

        }


        return res.send(
            registerPage()
        );

    }
);


// =====================================================
// =====================================================
// REGISTER POST
// =====================================================
// =====================================================

app.post(
    "/register",
    async (
        req,
        res
    ) => {

        const settings =
            loadSettings();


        if(
            settings.registrationsEnabled !==
            true
        ){

            return res.send(

                registerPage(

                    "Rejestracja jest obecnie wyłączona.",

                    "bad"

                )

            );

        }


        const login =
            String(
                req.body?.login || ""
            )
            .trim();


        const password =
            String(
                req.body?.password || ""
            );


        if(
            !/^[a-zA-Z0-9_.-]{3,30}$/.test(
                login
            )
        ){

            return res.send(

                registerPage(

                    "Login musi mieć od 3 do 30 znaków.",

                    "bad"

                )

            );

        }


        if(
            password.length <
            6
            ||
            password.length >
            100
        ){

            return res.send(

                registerPage(

                    "Hasło musi mieć od 6 do 100 znaków.",

                    "bad"

                )

            );

        }


        const users =
            loadUsers();


        const exists =
            Object.keys(
                users
            )
            .some(
                userLogin =>
                    userLogin
                        .toLowerCase()
                    ===
                    login
                        .toLowerCase()
            );


        if(
            exists
        ){

            return res.send(

                registerPage(

                    "Konto o takim loginie już istnieje.",

                    "bad"

                )

            );

        }


        try{

            const hash =
                await bcrypt.hash(
                    password,
                    12
                );


            users[
                login
            ] = {

                login:
                    login,

                password:
                    hash,

                saldo:
                    0,

                polaczono:
                    false,

                discordId:
                    null,

                discordNick:
                    null,

                discordLinkedAt:
                    null,

                blocked:
                    false,

                startOdebrany:
                    false,

                startClaimed:
                    false,

                ostatniaNagroda:
                    0,

                lastReward:
                    0,

                gry:
                    0,

                wygrane:
                    0,

                przegrane:
                    0,

                najwiekszaWygrana:
                    0,

                miner:
                    0,

                tower:
                    0,

                zdrapki:
                    0,

                sloty:
                    0,

                ruletka:
                    0,

                lucky:
                    0,

                crash:
                    0,

                skrzynkiOtwarte:
                    0,

                skrzynkiWydane:
                    0,

                skrzynkiWygrane:
                    0,

                notifications:
                    [],

                createdAt:
                    Date.now()

            };


            saveUsers(
                users
            );


            req.session.userId =
                login;


            req.session.flashNotification = {

                type:
                    "success",

                title:
                    "Konto utworzone",

                message:
                    "Witaj w 7BETS!"

            };


            addLog(

                login,

                "account_register",

                login

            );


            return res.redirect(
                "/panel"
            );

        }

        catch(error){

            console.error(
                "REGISTER ERROR:",
                error
            );


            return res.send(

                registerPage(

                    "Nie udało się utworzyć konta.",

                    "bad"

                )

            );

        }

    }
);


// =====================================================
// =====================================================
// LOGIN POST
// =====================================================
// =====================================================

app.post(
    "/login",
    async (
        req,
        res
    ) => {

        const query =
            String(
                req.body?.login || ""
            )
            .trim();


        const password =
            String(
                req.body?.password || ""
            );


        const users =
            loadUsers();


        const login =
            Object.keys(
                users
            )
            .find(
                userLogin =>
                    userLogin
                        .toLowerCase()
                    ===
                    query
                        .toLowerCase()
            );


        if(
            !login
        ){

            return res.send(

                loginPage(

                    "Nieprawidłowy login lub hasło.",

                    "bad"

                )

            );

        }


        const user =
            users[
                login
            ];


        ensureStats(
            user,
            login
        );


        if(
            user.blocked ===
            true
        ){

            return res.send(

                loginPage(

                    "To konto zostało zablokowane.",

                    "bad"

                )

            );

        }


        const hash =
            String(

                user.password

                ||

                user.haslo

                ||

                ""

            );


        let correct =
            false;


        try{

            correct =
                await bcrypt.compare(
                    password,
                    hash
                );

        }

        catch{

            correct =
                false;

        }


        if(
            !correct
        ){

            return res.send(

                loginPage(

                    "Nieprawidłowy login lub hasło.",

                    "bad"

                )

            );

        }


        saveUsers(
            users
        );


        req.session.userId =
            login;


        req.session.flashNotification = {

            type:
                "success",

            title:
                "Zalogowano",

            message:
                "Witaj ponownie w 7BETS."

        };


        return res.redirect(
            "/panel"
        );

    }
);


// =====================================================
// LOGOUT
// =====================================================

app.get(
    "/logout",
    (
        req,
        res
    ) => {

        req.session.destroy(
            () => {

                res.redirect(
                    "/login"
                );

            }
        );

    }
);


// =====================================================
// =====================================================
// API — AKTUALNE KONTO
// =====================================================
// =====================================================
//
// TO JEST WAŻNE DLA SALDA.
//
// STRONA CO 2.5 SEKUNDY POBIERA:
//
// /api/me
//
// WIĘC JEŻELI BOT ZMIENI SALDO,
// STRONA OD RAZU JE ZOBACZY.
//
// =====================================================

app.get(
    "/api/me",
    (
        req,
        res
    ) => {

        const account =
            getSessionUser(
                req
            );


        if(
            !account
        ){

            return res.status(
                401
            )
            .json({

                ok:false,

                logged:false

            });

        }


        ensureStats(
            account.user,
            account.login
        );


        return res.json({

            ok:
                true,

            logged:
                true,

            login:
                account.login,

            saldo:
                account.user.saldo,

            linked:
                account.user.polaczono ===
                true,

            blocked:
                account.user.blocked ===
                true

        });

    }
);


// =====================================================
// =====================================================
// PANEL
// =====================================================
// =====================================================

app.get(
    "/panel",
    (
        req,
        res
    ) => {

        const account =
            getSessionUser(
                req
            );


        if(
            !account
        ){

            return res.redirect(
                "/login"
            );

        }


        const {

            users,
            user,
            login

        } =
            account;


        if(
            user.blocked ===
            true
        ){

            return req.session.destroy(
                () => {

                    res.redirect(
                        "/login"
                    );

                }
            );

        }


        ensureStats(
            user,
            login
        );


        saveUsers(
            users
        );


        const linked =
            user.polaczono ===
            true;


        const rewardAmount =
            getRewardAmount();


        // =================================================
        // GRY
        // =================================================

        const games = [

            {

                icon:
                    "💎",

                name:
                    "Miner",

                key:
                    "miner",

                url:
                    "/game/miner",

                description:
                    "Odkrywaj pola i unikaj bomb."

            },


            {

                icon:
                    "🗼",

                name:
                    "Tower",

                key:
                    "tower",

                url:
                    "/game/tower",

                description:
                    "Wspinaj się coraz wyżej."

            },


            {

                icon:
                    "🎫",

                name:
                    "Zdrapka",

                key:
                    "scratch",

                url:
                    "/game/scratch",

                description:
                    "Kup zdrapkę i odkryj nagrodę."

            },


            {

                icon:
                    "🎰",

                name:
                    "Sloty",

                key:
                    "slots",

                url:
                    "/game/slots",

                description:
                    "Trzy animowane bębny."

            },


            {

                icon:
                    "🎡",

                name:
                    "Ruletka",

                key:
                    "roulette",

                url:
                    "/game/roulette",

                description:
                    "Czerwony, czarny lub zielony."

            },


            {

                icon:
                    "🔮",

                name:
                    "Lucky Orb",

                key:
                    "lucky",

                url:
                    "/game/lucky",

                description:
                    "Losowy mnożnik do dużych wygranych."

            },


            {

                icon:
                    "🚀",

                name:
                    "Crash",

                key:
                    "crash",

                url:
                    "/game/crash",

                eventOnly:
                    true,

                description:
                    "Wypłać zanim rakieta się rozbije."

            }

        ];


// =====================================================
// GAME CARDS
// =====================================================

        const cards =
            games
                .map(
                    game => {

                        const maintenance =
                            isGameMaintenance(
                                game.key
                            );


                        const eventLocked =

                            game.eventOnly ===
                            true

                            &&

                            !isCrashEventActive();


                        const available =

                            linked

                            &&

                            !maintenance

                            &&

                            !eventLocked;


                        let status =
                            "🟢 DOSTĘPNA";


                        if(
                            !linked
                        ){

                            status =
                                "🔒 ZABLOKOWANA";

                        }

                        else if(
                            maintenance
                        ){

                            status =
                                "🛠️ PRZERWA";

                        }

                        else if(
                            eventLocked
                        ){

                            status =
                                "⚡ CZEKAJ NA EVENT";

                        }


                        return `

<div class="game-card">


    <div class="game-icon">
        ${game.icon}
    </div>


    <h3>
        ${esc(
            game.name
        )}
    </h3>


    <p>
        ${esc(
            game.description
        )}
    </p>


    <div class="game-meta">

        <span>
            7BETS
        </span>

        <span>
            ${status}
        </span>

    </div>


    ${
        available

            ?

            `

<a
    href="${game.url}"
    class="btn"
>
    GRAJ →
</a>

`

            :

            linked

            ?

            `

<div
    class="btn secondary"
    style="
        opacity:.55;
        cursor:not-allowed
    "
>

    ${
        maintenance
            ?
            "NIEDOSTĘPNA"
            :
            "EVENT WYMAGANY"
    }

</div>

`

            :

            `

<div class="lock-overlay">

    <div>

        <div
            style="
                font-size:35px;
                margin-bottom:8px
            "
        >
            🔒
        </div>

        <strong>
            POŁĄCZ DISCORD
        </strong>

    </div>

</div>

`

    }


</div>

`;

                    }
                )
                .join(
                    ""
                );


// =====================================================
// FLASH
// =====================================================

        let flashScript =
            "";


        if(
            req.session
                .flashNotification
        ){

            const flash =
                req.session
                    .flashNotification;


            delete req.session
                .flashNotification;


            flashScript = `

setTimeout(
    () => {

        showNotification(

            ${JSON.stringify(
                flash.type
            )},

            ${JSON.stringify(
                flash.title
            )},

            ${JSON.stringify(
                flash.message
            )}

        );

    },
    250
);

`;

        }


// =====================================================
// PANEL HTML
// =====================================================

        return res.send(

            layout(

                "Panel",

                `

<div class="shell">


    ${topbar(
        user
    )}


    <!-- =============================================
         HERO
    ============================================== -->

    <div class="hero">


        <div class="eyebrow">
            7BETS • PANEL GRACZA
        </div>


        <h1>

            Witaj,

            <br>

            <span>
                ${esc(
                    user.login
                )}
            </span>

        </h1>


        <p>

            Odbieraj nagrody,
            korzystaj z eventów
            i graj w tryby 7BETS.

        </p>


        <div class="hero-actions">


            <a
                href="#games"
                class="btn"
            >
                🎮 ZOBACZ GRY
            </a>


            ${
                linked

                    ?

                    `

<div class="status-chip on">
    ● Discord połączony
</div>

`

                    :

                    `

<a
    href="/connect-discord"
    class="btn secondary"
>
    🔗 POŁĄCZ DISCORD
</a>

`

            }


        </div>


    </div>


    <!-- =============================================
         DASHBOARD
    ============================================== -->

    <div class="dashboard-grid">


        <!-- =========================================
             KONTO
        ========================================== -->

        <div class="glass account-card">


            <div class="eyebrow">
                TWOJE SALDO
            </div>


            <div
                class="balance-big"
                data-balance
            >
                ${formatMoney(
                    user.saldo
                )}
            </div>


            <div class="muted">
                Wirtualne saldo 7BETS
            </div>


            <div class="mini-stats">


                <div class="mini">

                    <small>
                        GRY
                    </small>

                    <strong>
                        ${user.gry}
                    </strong>

                </div>


                <div class="mini">

                    <small>
                        WYGRANE
                    </small>

                    <strong>
                        ${user.wygrane}
                    </strong>

                </div>


                <div class="mini">

                    <small>
                        PRZEGRANE
                    </small>

                    <strong>
                        ${user.przegrane}
                    </strong>

                </div>


                <div class="mini">

                    <small>
                        REKORD
                    </small>

                    <strong>
                        ${formatMoney(
                            user.najwiekszaWygrana
                        )}
                    </strong>

                </div>


            </div>


            <!-- =====================================
                 DISCORD
            ====================================== -->

            <div
                style="
                    margin-top:18px;
                    padding:15px;
                    border-radius:11px;
                    border:1px solid rgba(255,255,255,.04);
                    background:rgba(255,255,255,.02)
                "
            >


                <div class="eyebrow">
                    DISCORD
                </div>


                ${
                    linked

                        ?

                        `

<div class="status-chip on">

    🟢

    ${esc(
        user.discordNick ||
        "Połączono"
    )}

</div>

`

                        :

                        `

<div class="status-chip off">
    🔴 Niepołączony
</div>


<div style="margin-top:12px">

    <a
        href="/connect-discord"
        class="btn"
    >
        POŁĄCZ DISCORD
    </a>

</div>

`

                }


            </div>


        </div>


        <!-- =========================================
             NAGRODA
        ========================================== -->

        <div
            class="glass reward-card"
            id="reward"
        >


            <div class="eyebrow">
                NAGRODA CZASOWA
            </div>


            <h2>

                🎁 +

                ${formatMoney(
                    rewardAmount
                )}

            </h2>


            <p class="muted">
                Możesz odebrać ją co 5 minut.
            </p>


            <div
                class="timer"
                id="rewardTimer"
            >

                ${
                    linked
                        ?
                        "--:--"
                        :
                        "🔒"
                }

            </div>


            ${
                linked

                    ?

                    `

<button
    id="rewardButton"
    style="width:100%"
>
    ODBIERZ NAGRODĘ
</button>

`

                    :

                    `

<a
    href="/connect-discord"
    class="btn"
>
    POŁĄCZ DISCORD
</a>

`

            }


        </div>


    </div>


    <!-- =============================================
         GRY
    ============================================== -->

    <div
        class="section"
        id="games"
    >


        <div class="section-head">


            <div>

                <div class="eyebrow">
                    GAMES HUB
                </div>

                <h2>
                    🎮 GRY
                </h2>

            </div>


            <div class="muted">

                ${
                    linked
                        ?
                        "Wybierz grę."
                        :
                        "Połącz Discord, aby odblokować gry."
                }

            </div>


        </div>


        <div class="game-grid">

            ${cards}

        </div>


    </div>


</div>

`,

                `

// =====================================================
// FLASH
// =====================================================

${flashScript}


// =====================================================
// =====================================================
// NAGRODA — FRONTEND
// =====================================================
// =====================================================

${
    linked

        ?

        `

let rewardLast =
    ${Math.max(
        Number(
            user.ostatniaNagroda || 0
        ),
        Number(
            user.lastReward || 0
        )
    )};


let rewardCooldown =
    ${getRewardCooldown()};


let rewardRequest =
    false;


// =====================================================
// TIMER
// =====================================================

function updateReward(){

    const timer =
        document.getElementById(
            "rewardTimer"
        );


    const button =
        document.getElementById(
            "rewardButton"
        );


    if(
        !timer
        ||
        !button
    ){

        return;

    }


    const left =
        Math.max(

            0,

            rewardCooldown
            -
            (
                Date.now()
                -
                rewardLast
            )

        );


    if(
        left <=
        0
    ){

        timer.textContent =
            "GOTOWA!";


        button.disabled =
            rewardRequest;


        return;

    }


    const total =
        Math.ceil(
            left /
            1000
        );


    const minutes =
        Math.floor(
            total /
            60
        );


    const seconds =
        total %
        60;


    timer.textContent =

        String(
            minutes
        )
        .padStart(
            2,
            "0"
        )

        +

        ":"

        +

        String(
            seconds
        )
        .padStart(
            2,
            "0"
        );


    button.disabled =
        true;

}


// =====================================================
// SYNC STATUSU NAGRODY
// =====================================================

async function syncReward(){

    try{

        const response =
            await fetch(
                "/api/reward/status",
                {
                    cache:"no-store"
                }
            );


        if(
            !response.ok
        ){

            return;

        }


        const data =
            await response.json();


        if(
            !data.ok
        ){

            return;

        }


        rewardCooldown =
            Number(
                data.cooldown ||
                rewardCooldown
            );


        if(
            data.ready
        ){

            rewardLast =
                Date.now()
                -
                rewardCooldown;

        }

        else{

            rewardLast =
                Date.now()
                -
                (
                    rewardCooldown
                    -
                    Number(
                        data.remaining || 0
                    )
                );

        }


        if(
            Number.isFinite(
                Number(
                    data.saldo
                )
            )
        ){

            updateBalance(
                data.saldo
            );

        }


        updateReward();

    }

    catch{}

}


// =====================================================
// START TIMER
// =====================================================

syncReward();


updateReward();


setInterval(
    updateReward,
    500
);


setInterval(
    syncReward,
    15000
);


// =====================================================
// ODBIERZ NAGRODĘ
// =====================================================

document
    .getElementById(
        "rewardButton"
    )
    .addEventListener(
        "click",
        async () => {

            if(
                rewardRequest
            ){

                return;

            }


            rewardRequest =
                true;


            updateReward();


            const result =
                await api(
                    "/api/reward",
                    {
                        method:"POST"
                    }
                );


            const data =
                result.data;


            rewardRequest =
                false;


            if(
                !data.ok
            ){

                updateReward();


                showNotification(

                    "error",

                    "Nagroda niedostępna",

                    data.message ||
                    "Spróbuj ponownie później."

                );


                return;

            }


            // =============================================
            // AKTUALIZACJA SALDA OD RAZU
            // =============================================

            updateBalance(
                data.saldo
            );


            rewardLast =
                Date.now();


            rewardCooldown =
                Number(
                    data.remaining ||
                    rewardCooldown
                );


            updateReward();


            showNotification(

                "reward",

                "Nagroda odebrana",

                "Dodano "
                +
                money(
                    data.reward
                )
                +
                " do Twojego salda."

            );


            // dodatkowo sprawdzamy saldo z serwera

            setTimeout(
                refreshBalance,
                250
            );

        }
    );

`

        :

        ""

}

`

            )

        );

    }
);


// =====================================================
// =====================================================
// API — POWIADOMIENIA
// =====================================================
// =====================================================

app.get(
    "/api/notifications",
    (
        req,
        res
    ) => {

        const account =
            getSessionUser(
                req
            );


        if(
            !account
        ){

            return res.status(
                401
            )
            .json({

                ok:false,

                notifications:[]

            });

        }


        ensureStats(
            account.user,
            account.login
        );


        const notifications =
            account.user.notifications
                .slice(
                    0,
                    10
                );


        account.user.notifications =
            account.user.notifications
                .slice(
                    notifications.length
                );


        saveUsers(
            account.users
        );


        return res.json({

            ok:true,

            notifications:
                notifications

        });

    }
);


// =====================================================
// =====================================================
// DISCORD — STRONA
// =====================================================
// =====================================================

app.get(
    "/connect-discord",
    (
        req,
        res
    ) => {

        const account =
            getSessionUser(
                req
            );


        if(
            !account
        ){

            return res.redirect(
                "/login"
            );

        }


        if(
            account.user.polaczono ===
            true
        ){

            return res.redirect(
                "/panel"
            );

        }


        return res.send(

            layout(

                "Połącz Discord",

                `

<div class="shell">


    ${topbar(
        account.user
    )}


    <div
        class="glass auth-card"
        style="
            width:min(560px,100%);
            margin:80px auto
        "
    >


        <div class="eyebrow">
            DISCORD CONNECTION
        </div>


        <h2>
            🔗 Połącz konto Discord
        </h2>


        <p class="muted">

            Wpisz swoje Discord ID.

            Bot wyśle Ci prywatną wiadomość
            z potwierdzeniem konta.

        </p>


        <div
            class="field"
            style="margin-top:22px"
        >

            <label>
                DISCORD ID
            </label>

            <input
                id="discordId"
                placeholder="123456789012345678"
                maxlength="20"
            >

        </div>


        <button
            id="discordConnectButton"
            style="width:100%"
        >
            WYŚLIJ WIADOMOŚĆ PW
        </button>


        <div
            id="discordLinkInfo"
            class="muted"
            style="
                margin-top:15px;
                line-height:1.6
            "
        ></div>


    </div>


</div>

`,

                `

const discordButton =
    document.getElementById(
        "discordConnectButton"
    );


const discordInput =
    document.getElementById(
        "discordId"
    );


const discordInfo =
    document.getElementById(
        "discordLinkInfo"
    );


let discordInterval =
    null;


// =====================================================
// START LINK
// =====================================================

discordButton.addEventListener(
    "click",
    async () => {

        const discordId =
            discordInput.value.trim();


        if(
            !/^\\\\d{17,20}$/.test(
                discordId
            )
        ){

            showNotification(

                "error",

                "Nieprawidłowe ID",

                "Wpisz prawidłowe Discord ID."

            );


            return;

        }


        discordButton.disabled =
            true;


        discordInfo.textContent =
            "Tworzenie weryfikacji...";


        const result =
            await api(
                "/api/discord/link",
                {

                    method:"POST",

                    body:
                        JSON.stringify({

                            discordId:
                                discordId

                        })

                }
            );


        const data =
            result.data;


        if(
            !data.ok
        ){

            discordButton.disabled =
                false;


            discordInfo.textContent =
                data.message ||
                "Wystąpił błąd.";


            showNotification(

                "error",

                "Discord",

                data.message ||
                "Nie udało się rozpocząć weryfikacji."

            );


            return;

        }


        discordInfo.textContent =
            "⏳ Czekamy na wiadomość od bota...";


        showNotification(

            "discord",

            "Sprawdź Discord",

            "Bot wyśle Ci wiadomość prywatną."

        );


        startDiscordCheck();

    }
);


// =====================================================
// STATUS LINK
// =====================================================

function startDiscordCheck(){

    if(
        discordInterval
    ){

        clearInterval(
            discordInterval
        );

    }


    discordInterval =
        setInterval(
            async () => {

                const result =
                    await api(
                        "/api/discord/status"
                    );


                const data =
                    result.data;


                if(
                    !data.ok
                ){

                    return;

                }


                if(
                    data.linked ===
                    true
                ){

                    clearInterval(
                        discordInterval
                    );


                    discordInfo.textContent =
                        "✅ Konto Discord zostało połączone.";


                    showNotification(

                        "discord",

                        "Discord połączony",

                        "Konto zostało poprawnie zweryfikowane."

                    );


                    setTimeout(
                        () => {

                            location.href =
                                "/panel";

                        },
                        900
                    );


                    return;

                }


                if(
                    !data.pending
                ){

                    discordInfo.textContent =
                        "Brak aktywnej weryfikacji.";


                    return;

                }


                const state =
                    data.pending.status;


                if(
                    state ===
                    "waiting"
                ){

                    discordInfo.textContent =

                        data.pending.sent

                            ?

                            "📩 Wiadomość została wysłana. Potwierdź ją na Discordzie."

                            :

                            "⏳ Bot przygotowuje wiadomość...";

                }


                if(
                    state ===
                    "rejected"
                ){

                    clearInterval(
                        discordInterval
                    );


                    discordButton.disabled =
                        false;


                    discordInfo.textContent =
                        "❌ Weryfikacja odrzucona.";

                }


                if(
                    state ===
                    "expired"
                ){

                    clearInterval(
                        discordInterval
                    );


                    discordButton.disabled =
                        false;


                    discordInfo.textContent =
                        "⌛ Weryfikacja wygasła.";

                }


                if(
                    state ===
                    "dm_failed"
                ){

                    clearInterval(
                        discordInterval
                    );


                    discordButton.disabled =
                        false;


                    discordInfo.textContent =
                        "❌ Bot nie mógł wysłać wiadomości PW.";


                    showNotification(

                        "error",

                        "Discord",

                        "Sprawdź ustawienia prywatnych wiadomości Discord."

                    );

                }

            },
            1500
        );

}

`

            )

        );

    }
);


// =====================================================
// =====================================================
// API — DISCORD LINK
// =====================================================
// =====================================================

app.post(
    "/api/discord/link",
    (
        req,
        res
    ) => {

        const account =
            getSessionUser(
                req
            );


        if(
            !account
        ){

            return res.status(
                401
            )
            .json({

                ok:false,

                message:
                    "Musisz się zalogować."

            });

        }


        const {

            users,
            user,
            login

        } =
            account;


        if(
            user.polaczono ===
            true
        ){

            return res.status(
                409
            )
            .json({

                ok:false,

                message:
                    "Discord jest już połączony."

            });

        }


        const discordId =
            String(
                req.body?.discordId || ""
            )
            .trim();


        if(
            !/^\d{17,20}$/.test(
                discordId
            )
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                message:
                    "Nieprawidłowe Discord ID."

            });

        }


        // =================================================
        // CZY TEN DISCORD JUŻ JEST POŁĄCZONY
        // =================================================

        for(
            const [
                otherLogin,
                otherUser
            ]
            of Object.entries(
                users
            )
        ){

            if(
                otherLogin ===
                login
            ){

                continue;

            }


            if(
                otherUser?.polaczono ===
                true

                &&

                String(
                    otherUser.discordId || ""
                )
                ===
                discordId
            ){

                return res.status(
                    409
                )
                .json({

                    ok:false,

                    message:
                        "Ten Discord jest już połączony z innym kontem."

                });

            }

        }


        clearPendingForLogin(
            login
        );


        clearPendingForDiscordId(
            discordId
        );


        const pending =
            loadPending();


        const token =
            crypto
                .randomBytes(
                    24
                )
                .toString(
                    "hex"
                );


        pending[
            token
        ] = {

            token:
                token,

            login:
                login,

            discordId:
                discordId,

            discordNick:
                null,

            createdAt:
                Date.now(),

            expiresAt:

                Date.now()

                +

                10 *
                60 *
                1000,

            status:
                "waiting",

            sent:
                false,

            dmAttempts:
                0

        };


        savePending(
            pending
        );


        user.polaczono =
            false;


        user.discordId =
            null;


        user.discordNick =
            null;


        saveUsers(
            users
        );


        addLog(

            login,

            "discord_link_request",

            discordId

        );


        return res.json({

            ok:true,

            token:
                token,

            pending:
                true

        });

    }
);


// =====================================================
// =====================================================
// API — DISCORD STATUS
// =====================================================
// =====================================================

app.get(
    "/api/discord/status",
    (
        req,
        res
    ) => {

        const account =
            getSessionUser(
                req
            );


        if(
            !account
        ){

            return res.status(
                401
            )
            .json({

                ok:false

            });

        }


        // =================================================
        // BOT MÓGŁ WŁAŚNIE ZAPISAĆ users.json
        // DLATEGO ACCOUNT JEST WCZYTYWANY NA NOWO
        // PRZY KAŻDYM REQUEST
        // =================================================

        if(
            account.user.polaczono ===
            true
        ){

            return res.json({

                ok:true,

                linked:true,

                discordId:
                    account.user.discordId,

                discordNick:
                    account.user.discordNick,

                pending:null

            });

        }


        const pending =
            loadPending();


        const request =
            Object.values(
                pending
            )
            .find(
                item =>
                    String(
                        item?.login || ""
                    )
                    .toLowerCase()
                    ===
                    String(
                        account.login
                    )
                    .toLowerCase()
            );


        return res.json({

            ok:true,

            linked:false,

            pending:

                request

                    ?

                    {

                        status:
                            request.status,

                        sent:
                            request.sent ===
                            true,

                        attempts:
                            Number(
                                request.dmAttempts || 0
                            ),

                        createdAt:
                            request.createdAt,

                        expiresAt:
                            request.expiresAt

                    }

                    :

                    null

        });

    }
);


// =====================================================
// =====================================================
// KONIEC SERVER.JS V7 — CZĘŚĆ 2/6
// =====================================================
//
// CZĘŚĆ 3/6:
//
// 📦 SKRZYNKI
//
// ✅ BASIC
// ✅ PREMIUM
// ✅ ROYAL
//
// ✅ 1 SKRZYNKA = 1 ANIMACJA
// ✅ 2 = 2 ANIMACJE
// ✅ 3 = 3 ANIMACJE
// ✅ 5 = 5 ANIMACJI
// ✅ 10 = 10 ANIMACJI
// ✅ 25 = 25 ANIMACJI NA RAZ
//
// ✅ KAŻDA SKRZYNKA MA SWÓJ DROP
//
// ✅ KOSZT
// ✅ WARTOŚĆ
// ✅ ZYSK / STRATA
//
// ✅ PO OTWARCIU:
//    updateBalance(data.saldo)
//
// ✅ SALDO DODATKOWO SYNCHRONIZUJE SIĘ
//    AUTOMATYCZNIE PRZEZ /api/me
//
// ✅ LUCK
//
// NIE DODAWAJ JESZCZE app.listen()
//
// =====================================================
// =====================================================
// =====================================================
//                  7BETS SERVER
//                 POPRAWIONY V7
// =====================================================
// =====================================================
//
// SERVER.JS — CZĘŚĆ 3/6
//
// 📦 SKRZYNKI
//
// ✅ BASIC
// ✅ PREMIUM
// ✅ ROYAL
//
// ✅ 1  = 1 animacja
// ✅ 2  = 2 animacje
// ✅ 3  = 3 animacje
// ✅ 5  = 5 animacji
// ✅ 10 = 10 animacji
// ✅ 25 = 25 animacji jednocześnie
//
// ✅ KAŻDA SKRZYNKA MA SWÓJ DROP
// ✅ ANIMACJE LOSOWANIA
// ✅ RARITY
// ✅ SZANSE
// ✅ WARTOŚCI
// ✅ KOSZT
// ✅ ZYSK / STRATA
//
// ✅ LUCK EVENT
//
// ✅ SALDO AKTUALIZUJE SIĘ OD RAZU
//
// WKLEJ POD 2/6
//
// =====================================================


// =====================================================
// =====================================================
// SKRZYNKI — CONFIG
// =====================================================
// =====================================================

const CRATES = {

    // =================================================
    // BASIC
    // =================================================

    basic: {

        id:
            "basic",

        name:
            "BASIC CASE",

        icon:
            "📦",

        subtitle:
            "Podstawowa skrzynka 7BETS",

        price:
            50,

        items: [

            {

                name:
                    "Glock-18",

                icon:
                    "🔫",

                value:
                    15,

                chance:
                    32,

                rarity:
                    "common"

            },

            {

                name:
                    "P250",

                icon:
                    "🔫",

                value:
                    30,

                chance:
                    27,

                rarity:
                    "common"

            },

            {

                name:
                    "MP5",

                icon:
                    "🔫",

                value:
                    55,

                chance:
                    20,

                rarity:
                    "uncommon"

            },

            {

                name:
                    "UMP-45",

                icon:
                    "🔫",

                value:
                    90,

                chance:
                    12,

                rarity:
                    "rare"

            },

            {

                name:
                    "Desert Eagle",

                icon:
                    "🔫",

                value:
                    180,

                chance:
                    7,

                rarity:
                    "epic"

            },

            {

                name:
                    "AK-47",

                icon:
                    "🔥",

                value:
                    450,

                chance:
                    2,

                rarity:
                    "legendary"

            }

        ]

    },


    // =================================================
    // PREMIUM
    // =================================================

    premium: {

        id:
            "premium",

        name:
            "PREMIUM CASE",

        icon:
            "💎",

        subtitle:
            "Skrzynka z lepszymi dropami",

        price:
            250,

        items: [

            {

                name:
                    "MP7",

                icon:
                    "🔫",

                value:
                    80,

                chance:
                    27,

                rarity:
                    "common"

            },

            {

                name:
                    "FAMAS",

                icon:
                    "🔫",

                value:
                    150,

                chance:
                    24,

                rarity:
                    "uncommon"

            },

            {

                name:
                    "M4A4",

                icon:
                    "🔫",

                value:
                    280,

                chance:
                    21,

                rarity:
                    "rare"

            },

            {

                name:
                    "AK-47 Crimson",

                icon:
                    "🔥",

                value:
                    500,

                chance:
                    15,

                rarity:
                    "epic"

            },

            {

                name:
                    "AWP",

                icon:
                    "🎯",

                value:
                    950,

                chance:
                    9,

                rarity:
                    "legendary"

            },

            {

                name:
                    "Shadow Knife",

                icon:
                    "🗡️",

                value:
                    2500,

                chance:
                    4,

                rarity:
                    "mythic"

            }

        ]

    },


    // =================================================
    // ROYAL
    // =================================================

    royal: {

        id:
            "royal",

        name:
            "ROYAL CASE",

        icon:
            "👑",

        subtitle:
            "Najdroższe przedmioty 7BETS",

        price:
            1000,

        items: [

            {

                name:
                    "M4A1-S Gold",

                icon:
                    "🌟",

                value:
                    350,

                chance:
                    27,

                rarity:
                    "uncommon"

            },

            {

                name:
                    "AK-47 Neon",

                icon:
                    "⚡",

                value:
                    700,

                chance:
                    24,

                rarity:
                    "rare"

            },

            {

                name:
                    "AWP Dragon",

                icon:
                    "🐉",

                value:
                    1400,

                chance:
                    20,

                rarity:
                    "epic"

            },

            {

                name:
                    "Karambit",

                icon:
                    "🔪",

                value:
                    3000,

                chance:
                    15,

                rarity:
                    "legendary"

            },

            {

                name:
                    "Butterfly Knife",

                icon:
                    "🦋",

                value:
                    5500,

                chance:
                    10,

                rarity:
                    "mythic"

            },

            {

                name:
                    "Dragon Knife",

                icon:
                    "🐲",

                value:
                    15000,

                chance:
                    4,

                rarity:
                    "god"

            }

        ]

    }

};


// =====================================================
// DOZWOLONE ILOŚCI
// =====================================================

const CRATE_COUNTS = [

    1,
    2,
    3,
    5,
    10,
    25

];


// =====================================================
// =====================================================
// RARITY
// =====================================================
// =====================================================

const RARITY_INFO = {

    common: {

        name:
            "COMMON",

        color:
            "#859ba3"

    },

    uncommon: {

        name:
            "UNCOMMON",

        color:
            "#55f5b3"

    },

    rare: {

        name:
            "RARE",

        color:
            "#5cecff"

    },

    epic: {

        name:
            "EPIC",

        color:
            "#b07aff"

    },

    legendary: {

        name:
            "LEGENDARY",

        color:
            "#ffd166"

    },

    mythic: {

        name:
            "MYTHIC",

        color:
            "#ff687b"

    },

    god: {

        name:
            "GOD",

        color:
            "#fff19c"

    }

};


// =====================================================
// =====================================================
// RAW ROLL
// =====================================================
// =====================================================

function rollRawCrateItem(
    crate
){

    const roll =
        Math.random() *
        100;


    let current =
        0;


    for(
        const item
        of crate.items
    ){

        current +=
            Number(
                item.chance || 0
            );


        if(
            roll <=
            current
        ){

            return {

                ...item

            };

        }

    }


    return {

        ...crate.items[
            crate.items.length -
            1
        ]

    };

}


// =====================================================
// =====================================================
// ROLL + LUCK
// =====================================================
// =====================================================

function rollCrateItem(
    crate
){

    let best =
        rollRawCrateItem(
            crate
        );


    if(
        isLuckActive()
    ){

        const boost =
            getLuckBoost();


        let rerolls =
            1;


        if(
            boost >=
            1.60
        ){

            rerolls =
                2;

        }


        for(
            let i = 0;
            i < rerolls;
            i++
        ){

            const other =
                rollRawCrateItem(
                    crate
                );


            if(
                Number(
                    other.value
                )
                >
                Number(
                    best.value
                )
            ){

                best =
                    other;

            }

        }

    }


    return best;

}


// =====================================================
// =====================================================
// API — LISTA SKRZYNEK
// =====================================================
// =====================================================

app.get(
    "/api/crates",
    (
        req,
        res
    ) => {

        return res.json({

            ok:
                true,

            luck:
                isLuckActive(),

            luckBoost:
                getLuckBoost(),

            counts:
                CRATE_COUNTS,

            crates:
                Object.values(
                    CRATES
                )
                .map(
                    crate => ({

                        id:
                            crate.id,

                        name:
                            crate.name,

                        icon:
                            crate.icon,

                        subtitle:
                            crate.subtitle,

                        price:
                            crate.price,

                        items:
                            crate.items

                    })
                )

        });

    }
);


// =====================================================
// =====================================================
// API — OTWARCIE
// =====================================================
// =====================================================

app.post(
    "/api/crates/open",
    (
        req,
        res
    ) => {

        if(
            !requireGameAvailable(
                req,
                res,
                "crates"
            )
        ){

            return;

        }


        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user,
            login

        } =
            account;


        const settings =
            loadSettings();


        if(
            settings.economyEnabled !==
            true
        ){

            return res.status(
                503
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Ekonomia jest obecnie wyłączona."

            });

        }


        const crateId =
            String(
                req.body?.crate || ""
            )
            .trim()
            .toLowerCase();


        const crate =
            CRATES[
                crateId
            ];


        if(
            !crate
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Nieprawidłowa skrzynka."

            });

        }


        const count =
            Number(
                req.body?.count
            );


        if(
            !CRATE_COUNTS.includes(
                count
            )
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Nieprawidłowa liczba skrzynek."

            });

        }


        // =================================================
        // KOSZT
        // =================================================

        const totalCost =
            roundMoney(

                Number(
                    crate.price
                )
                *
                count

            );


        if(
            user.saldo <
            totalCost
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Masz za mało pieniędzy."

            });

        }


        // =================================================
        // POBRANIE KASY
        // =================================================

        user.saldo =
            roundMoney(

                user.saldo -
                totalCost

            );


        // =================================================
        // DROPY
        // =================================================

        const drops =
            [];


        let totalValue =
            0;


        for(
            let i = 0;
            i < count;
            i++
        ){

            const item =
                rollCrateItem(
                    crate
                );


            const value =
                roundMoney(
                    item.value
                );


            totalValue +=
                value;


            drops.push({

                index:
                    i,

                name:
                    item.name,

                icon:
                    item.icon,

                value:
                    value,

                chance:
                    item.chance,

                rarity:
                    item.rarity,

                rarityName:

                    RARITY_INFO[
                        item.rarity
                    ]?.name

                    ||

                    String(
                        item.rarity
                    )
                    .toUpperCase(),

                rarityColor:

                    RARITY_INFO[
                        item.rarity
                    ]?.color

                    ||

                    "#5cecff"

            });

        }


        totalValue =
            roundMoney(
                totalValue
            );


        // =================================================
        // AUTOMATYCZNA SPRZEDAŻ DROPÓW
        // =================================================

        user.saldo =
            roundMoney(

                user.saldo +
                totalValue

            );


        // =================================================
        // ZYSK
        // =================================================

        const profit =
            roundMoney(
                totalValue -
                totalCost
            );


        // =================================================
        // STATS
        // =================================================

        user.skrzynkiOtwarte =
            Number(
                user.skrzynkiOtwarte || 0
            )
            +
            count;


        user.skrzynkiWydane =
            roundMoney(

                Number(
                    user.skrzynkiWydane || 0
                )
                +
                totalCost

            );


        user.skrzynkiWygrane =
            roundMoney(

                Number(
                    user.skrzynkiWygrane || 0
                )
                +
                totalValue

            );


        saveUsers(
            users
        );


        addLog(

            login,

            "crate_open",

            crate.name,

            (
                count
                +
                " szt. | koszt "
                +
                formatMoney(
                    totalCost
                )
                +
                " | wartość "
                +
                formatMoney(
                    totalValue
                )
                +
                " | zysk "
                +
                formatMoney(
                    profit
                )
            )

        );


        return res.json({

            ok:true,

            crate:{

                id:
                    crate.id,

                name:
                    crate.name,

                icon:
                    crate.icon,

                price:
                    crate.price

            },

            count:
                count,

            cost:
                totalCost,

            value:
                totalValue,

            profit:
                profit,

            // =================================================
            // WAŻNE
            // =================================================

            saldo:
                user.saldo,

            luck:
                isLuckActive(),

            luckBoost:
                getLuckBoost(),

            drops:
                drops

        });

    }
);


// =====================================================
// =====================================================
// STRONA SKRZYNEK
// =====================================================
// =====================================================

app.get(
    "/crates",
    (
        req,
        res
    ) => {

        const account =
            getSessionUser(
                req
            );


        if(
            !account
        ){

            return res.redirect(
                "/login"
            );

        }


        const {

            users,
            user,
            login

        } =
            account;


        ensureStats(
            user,
            login
        );


        saveUsers(
            users
        );


        const linked =
            user.polaczono ===
            true;


        const publicCrates =
            Object.fromEntries(

                Object.entries(
                    CRATES
                )
                .map(
                    (
                        [
                            key,
                            crate
                        ]
                    ) => [

                        key,

                        {

                            id:
                                crate.id,

                            name:
                                crate.name,

                            icon:
                                crate.icon,

                            subtitle:
                                crate.subtitle,

                            price:
                                crate.price,

                            items:
                                crate.items

                        }

                    ]
                )

            );


// =====================================================
// KARTY
// =====================================================

        const crateCards =
            Object.values(
                CRATES
            )
            .map(
                crate => {

                    const best =
                        crate.items[
                            crate.items.length -
                            1
                        ];


                    return `

<div
    class="advanced-crate-card"
    data-crate="${crate.id}"
>

    <div class="crate-light"></div>


    <div class="crate-top">

        <span>
            7BETS CASE
        </span>

        <strong>
            ${formatMoney(
                crate.price
            )}
        </strong>

    </div>


    <div class="crate-big-icon">

        ${crate.icon}

    </div>


    <div class="crate-name">

        ${esc(
            crate.name
        )}

    </div>


    <div class="crate-description">

        ${esc(
            crate.subtitle
        )}

    </div>


    <div class="crate-best">


        <small>
            NAJLEPSZY DROP
        </small>


        <strong>

            ${esc(
                best.name
            )}

        </strong>


        <span>

            ${formatMoney(
                best.value
            )}

        </span>


    </div>


    <button
        data-select-crate="${crate.id}"
        style="width:100%"
    >

        WYBIERZ

    </button>


</div>

`;

                }
            )
            .join(
                ""
            );


// =====================================================
// PAGE
// =====================================================

        return res.send(

            layout(

                "Skrzynki",

                `

<style>

/* =====================================================
   HERO
===================================================== */

.crates-header{

    padding:
        55px 15px 30px;

}


.crates-header h1{

    margin:0;

    font-size:
        clamp(
            55px,
            9vw,
            110px
        );

    line-height:.88;

    letter-spacing:-7px;

}


.crates-header h1 span{

    color:
        var(--cyan);

}


.crates-header p{

    max-width:650px;

    color:#78949d;

    line-height:1.7;

}


/* =====================================================
   LUCK
===================================================== */

.crate-luck{

    display:inline-flex;

    align-items:center;

    gap:7px;

    margin-top:12px;

    padding:
        8px 12px;

    border-radius:999px;

    color:
        var(--yellow);

    border:
        1px solid
        rgba(255,209,102,.18);

    background:
        rgba(255,209,102,.05);

    font-size:10px;

    font-weight:1000;

}


/* =====================================================
   GRID SKRZYNEK
===================================================== */

.crates-grid{

    display:grid;

    grid-template-columns:
        repeat(
            3,
            1fr
        );

    gap:14px;

}


.advanced-crate-card{

    min-height:410px;

    position:relative;

    overflow:hidden;

    padding:19px;

    border-radius:18px;

    border:
        1px solid
        rgba(92,236,255,.12);

    background:

        radial-gradient(
            circle at 50% 35%,
            rgba(92,236,255,.10),
            transparent 38%
        ),

        linear-gradient(
            145deg,
            #0a202b,
            #040e14
        );

    transition:.22s ease;

}


.advanced-crate-card:hover{

    transform:
        translateY(-4px);

    border-color:
        rgba(92,236,255,.35);

    box-shadow:

        0 25px 70px
        rgba(0,0,0,.30);

}


.advanced-crate-card.selected{

    border-color:
        rgba(92,236,255,.60);

    box-shadow:

        0 0 35px
        rgba(92,236,255,.09);

}


.crate-light{

    position:absolute;

    width:220px;

    height:220px;

    left:50%;

    top:80px;

    transform:
        translateX(-50%);

    border-radius:50%;

    background:
        var(--cyan);

    opacity:.08;

    filter:
        blur(60px);

}


.crate-top{

    display:flex;

    justify-content:space-between;

    gap:10px;

    color:#78949d;

    font-size:9px;

    font-weight:900;

}


.crate-top strong{

    color:
        var(--cyan);

    font-size:12px;

}


.crate-big-icon{

    height:170px;

    display:grid;

    place-items:center;

    position:relative;

    font-size:90px;

    animation:

        crateHover
        3s
        ease-in-out
        infinite;

}


@keyframes crateHover{

    0%,
    100%{

        transform:
            translateY(0)
            rotate(-2deg);

    }

    50%{

        transform:
            translateY(-9px)
            rotate(2deg);

    }

}


.crate-name{

    font-size:23px;

    font-weight:1000;

    letter-spacing:-1px;

}


.crate-description{

    min-height:34px;

    margin-top:4px;

    color:#708b94;

    font-size:11px;

}


.crate-best{

    display:grid;

    grid-template-columns:
        1fr auto;

    gap:4px 10px;

    margin:
        14px 0;

    padding:11px;

    border-radius:10px;

    border:
        1px solid
        rgba(255,255,255,.045);

    background:
        rgba(255,255,255,.022);

}


.crate-best small{

    grid-column:
        1 /
        3;

    color:#657d86;

    font-size:8px;

    font-weight:1000;

}


.crate-best strong{

    font-size:10px;

}


.crate-best span{

    color:
        var(--yellow);

    font-size:10px;

    font-weight:1000;

}


/* =====================================================
   OPENER
===================================================== */

.crate-opener{

    margin-top:24px;

    padding:20px;

}


.crate-opener-header{

    display:flex;

    align-items:center;

    justify-content:space-between;

    gap:15px;

    flex-wrap:wrap;

}


.crate-opener-name{

    margin-top:3px;

    font-size:
        clamp(
            27px,
            5vw,
            43px
        );

    font-weight:1000;

    letter-spacing:-2px;

}


.crate-controls{

    display:grid;

    grid-template-columns:
        1fr 1fr;

    gap:10px;

    margin-top:18px;

}


.crate-control{

    padding:13px;

    border-radius:11px;

    border:
        1px solid
        rgba(255,255,255,.045);

    background:
        rgba(255,255,255,.02);

}


.crate-control small{

    display:block;

    margin-bottom:7px;

    color:#66808a;

    font-size:8px;

    font-weight:1000;

}


.crate-summary{

    display:grid;

    grid-template-columns:
        repeat(
            3,
            1fr
        );

    gap:8px;

    margin-top:12px;

}


.crate-summary-card{

    padding:13px;

    border-radius:11px;

    border:
        1px solid
        rgba(255,255,255,.045);

    background:
        rgba(255,255,255,.022);

}


.crate-summary-card small{

    display:block;

    margin-bottom:4px;

    color:#647d86;

    font-size:8px;

    font-weight:1000;

}


.crate-summary-card strong{

    font-size:18px;

}


#openCrateButton{

    width:100%;

    min-height:50px;

    margin-top:12px;

}


/* =====================================================
   MULTI OPENING
===================================================== */

.multi-opening-section{

    display:none;

    margin-top:25px;

}


.multi-opening-section.active{

    display:block;

}


.multi-opening-title{

    display:flex;

    align-items:center;

    justify-content:space-between;

    gap:15px;

    margin-bottom:12px;

}


.multi-opening-grid{

    display:grid;

    grid-template-columns:

        repeat(
            auto-fit,
            minmax(
                135px,
                1fr
            )
        );

    gap:9px;

}


/* =====================================================
   POJEDYNCZA ANIMACJA
===================================================== */

.multi-case{

    min-height:155px;

    position:relative;

    overflow:hidden;

    display:flex;

    flex-direction:column;

    align-items:center;

    justify-content:center;

    padding:12px;

    text-align:center;

    border-radius:13px;

    border:
        1px solid
        rgba(92,236,255,.12);

    background:

        radial-gradient(
            circle at 50% 40%,
            rgba(92,236,255,.08),
            transparent 60%
        ),

        linear-gradient(
            145deg,
            #091d27,
            #041017
        );

    box-shadow:

        inset 0 0 30px
        rgba(0,0,0,.25);

}


.multi-case::before{

    content:"";

    position:absolute;

    inset:0;

    background:

        linear-gradient(
            110deg,
            transparent 20%,
            rgba(92,236,255,.10),
            transparent 80%
        );

    transform:
        translateX(-130%);

}


.multi-case.rolling::before{

    animation:

        caseScan
        .60s
        linear
        infinite;

}


@keyframes caseScan{

    from{

        transform:
            translateX(-130%);

    }

    to{

        transform:
            translateX(130%);

    }

}


.multi-case-index{

    position:absolute;

    top:7px;

    left:8px;

    color:#526b74;

    font-size:8px;

    font-weight:1000;

}


.multi-case-icon{

    position:relative;

    z-index:2;

    font-size:38px;

}


.multi-case.rolling
.multi-case-icon{

    animation:

        caseShake
        .12s
        linear
        infinite;

}


@keyframes caseShake{

    0%{

        transform:
            translateY(-4px)
            scale(.95);

        opacity:.55;

    }

    50%{

        transform:
            translateY(4px)
            scale(1.06);

        opacity:1;

    }

    100%{

        transform:
            translateY(-4px)
            scale(.95);

        opacity:.55;

    }

}


.multi-case-name{

    min-height:26px;

    position:relative;

    z-index:2;

    display:flex;

    align-items:center;

    justify-content:center;

    margin-top:8px;

    color:#fff;

    font-size:10px;

    font-weight:1000;

}


.multi-case-value{

    position:relative;

    z-index:2;

    margin-top:5px;

    color:
        var(--cyan);

    font-size:10px;

    font-weight:1000;

}


.multi-case-rarity{

    position:relative;

    z-index:2;

    margin-top:3px;

    font-size:7px;

    font-weight:1000;

}


.multi-case.finished{

    animation:

        caseFinished
        .36s
        ease;

}


@keyframes caseFinished{

    0%{

        transform:
            scale(.87);

    }

    55%{

        transform:
            scale(1.07);

    }

    100%{

        transform:
            scale(1);

    }

}


/* =====================================================
   25 SKRZYNEK
===================================================== */

.multi-opening-grid.count-25{

    grid-template-columns:
        repeat(
            5,
            1fr
        );

}


.multi-opening-grid.count-25
.multi-case{

    min-height:120px;

    padding:8px;

}


.multi-opening-grid.count-25
.multi-case-icon{

    font-size:28px;

}


.multi-opening-grid.count-25
.multi-case-name{

    font-size:8px;

}


.multi-opening-grid.count-25
.multi-case-value{

    font-size:9px;

}


/* =====================================================
   FINAL RESULT
===================================================== */

.crate-final{

    display:none;

    grid-template-columns:
        repeat(
            3,
            1fr
        );

    gap:9px;

    margin-top:18px;

}


.crate-final.active{

    display:grid;

}


.crate-final-card{

    padding:16px;

    border-radius:11px;

    border:
        1px solid
        rgba(255,255,255,.045);

    background:
        rgba(255,255,255,.022);

}


.crate-final-card small{

    display:block;

    margin-bottom:5px;

    color:#67818a;

    font-size:8px;

    font-weight:1000;

}


.crate-final-card strong{

    font-size:
        clamp(
            18px,
            3vw,
            27px
        );

}


/* =====================================================
   DROPS
===================================================== */

.drops-section{

    margin-top:20px;

}


.drops-grid{

    display:grid;

    grid-template-columns:

        repeat(
            auto-fit,
            minmax(
                140px,
                1fr
            )
        );

    gap:8px;

}


.drop-card{

    min-height:145px;

    padding:13px;

    position:relative;

    overflow:hidden;

    border-radius:11px;

    border:
        1px solid
        rgba(255,255,255,.05);

    background:

        linear-gradient(
            145deg,
            #0a222d,
            #041017
        );

}


.drop-card::after{

    content:"";

    position:absolute;

    left:0;

    right:0;

    bottom:0;

    height:3px;

    background:
        var(
            --drop-color
        );

}


.drop-card-icon{

    font-size:35px;

}


.drop-card-name{

    margin-top:8px;

    font-size:11px;

    font-weight:1000;

}


.drop-card-rarity{

    margin-top:4px;

    font-size:7px;

    font-weight:1000;

}


.drop-card-value{

    margin-top:8px;

    font-size:15px;

    font-weight:1000;

}


/* =====================================================
   CONTENT
===================================================== */

.crate-content-title{

    margin:
        25px 0 12px;

}


.possible-items{

    display:grid;

    grid-template-columns:

        repeat(
            auto-fit,
            minmax(
                145px,
                1fr
            )
        );

    gap:8px;

}


.possible-item{

    min-height:125px;

    padding:12px;

    border-radius:11px;

    border:
        1px solid
        rgba(255,255,255,.045);

    background:
        rgba(255,255,255,.022);

}


.possible-icon{

    font-size:29px;

}


.possible-name{

    margin-top:7px;

    font-size:10px;

    font-weight:1000;

}


.possible-rarity{

    margin-top:3px;

    font-size:7px;

    font-weight:1000;

}


.possible-meta{

    display:flex;

    justify-content:space-between;

    gap:7px;

    margin-top:9px;

    color:#718b94;

    font-size:8px;

}


/* =====================================================
   RESPONSIVE
===================================================== */

@media(max-width:900px){

    .crates-grid{

        grid-template-columns:
            1fr;

    }


    .multi-opening-grid.count-25{

        grid-template-columns:
            repeat(
                3,
                1fr
            );

    }

}


@media(max-width:600px){

    .crate-controls{

        grid-template-columns:
            1fr;

    }


    .crate-summary,
    .crate-final{

        grid-template-columns:
            1fr;

    }


    .multi-opening-grid,
    .multi-opening-grid.count-25{

        grid-template-columns:
            repeat(
                2,
                1fr
            );

    }

}

</style>


<div class="shell">


    ${topbar(
        user
    )}


    <!-- =============================================
         HEADER
    ============================================== -->

    <div class="crates-header">


        <div class="eyebrow">
            7BETS • CASE OPENING
        </div>


        <h1>

            OTWÓRZ

            <br>

            <span>
                SKRZYNKI.
            </span>

        </h1>


        <p>

            Wybierz skrzynkę,
            ustaw ile chcesz otworzyć
            i obserwuj każde losowanie osobno.

            Przy 25 skrzynkach
            zobaczysz 25 animacji
            otwierających się jednocześnie.

        </p>


        ${
            isLuckActive()

                ?

                `

<div class="crate-luck">

    🍀 LUCK ACTIVE

    • x${getLuckBoost().toFixed(2)}

</div>

`

                :

                ""

        }


        ${
            !linked

                ?

                `

<div
    class="status-chip off"
    style="margin-top:12px"
>

    🔒 Połącz Discord,
    aby otwierać skrzynki.

</div>

`

                :

                ""

        }


    </div>


    <!-- =============================================
         CRATE LIST
    ============================================== -->

    <div class="crates-grid">

        ${crateCards}

    </div>


    <!-- =============================================
         OPENER
    ============================================== -->

    <div
        class="glass crate-opener"
        id="crateOpener"
    >


        <div class="crate-opener-header">


            <div>

                <div class="eyebrow">
                    WYBRANA SKRZYNKA
                </div>

                <div
                    class="crate-opener-name"
                    id="selectedCrateName"
                >
                    BASIC CASE
                </div>

            </div>


            <div
                class="status-chip ${
                    linked
                        ?
                        "on"
                        :
                        "off"
                }"
            >

                ${
                    linked
                        ?
                        "● GOTOWE"
                        :
                        "🔒 DISCORD WYMAGANY"
                }

            </div>


        </div>


        <!-- =========================================
             CONTROLS
        ========================================== -->

        <div class="crate-controls">


            <div class="crate-control">

                <small>
                    ILE OTWORZYĆ
                </small>


                <select id="crateCount">

                    <option value="1">
                        1 skrzynka
                    </option>

                    <option value="2">
                        2 skrzynki
                    </option>

                    <option value="3">
                        3 skrzynki
                    </option>

                    <option value="5">
                        5 skrzynek
                    </option>

                    <option value="10">
                        10 skrzynek
                    </option>

                    <option value="25">
                        25 skrzynek
                    </option>

                </select>

            </div>


            <div class="crate-control">

                <small>
                    CENA JEDNEJ
                </small>

                <strong
                    id="singleCratePrice"
                    style="
                        font-size:24px
                    "
                >
                    50,00 zł
                </strong>

            </div>


        </div>


        <!-- =========================================
             SUMMARY
        ========================================== -->

        <div class="crate-summary">


            <div class="crate-summary-card">

                <small>
                    KOSZT
                </small>

                <strong
                    id="crateTotalCost"
                    style="color:var(--red)"
                >
                    -50,00 zł
                </strong>

            </div>


            <div class="crate-summary-card">

                <small>
                    TWOJE SALDO
                </small>

                <strong
                    data-balance
                    style="color:var(--cyan)"
                >
                    ${formatMoney(
                        user.saldo
                    )}
                </strong>

            </div>


            <div class="crate-summary-card">

                <small>
                    LUCK
                </small>

                <strong>

                    ${
                        isLuckActive()
                            ?
                            "🍀 ON"
                            :
                            "OFF"
                    }

                </strong>

            </div>


        </div>


        <button
            id="openCrateButton"
            ${
                linked
                    ?
                    ""
                    :
                    "disabled"
            }
        >
            OTWÓRZ
        </button>


        <!-- =========================================
             MULTI OPENING
        ========================================== -->

        <div
            class="multi-opening-section"
            id="multiOpeningSection"
        >


            <div class="multi-opening-title">

                <div>

                    <div class="eyebrow">
                        LOSOWANIE
                    </div>

                    <strong id="multiOpeningText">
                        Otwieranie skrzynek...
                    </strong>

                </div>

            </div>


            <div
                class="multi-opening-grid"
                id="multiOpeningGrid"
            >
            </div>


        </div>


        <!-- =========================================
             FINAL
        ========================================== -->

        <div
            class="crate-final"
            id="crateFinal"
        >


            <div class="crate-final-card">

                <small>
                    WYDANO
                </small>

                <strong
                    id="crateFinalCost"
                    style="color:var(--red)"
                >
                    -
                </strong>

            </div>


            <div class="crate-final-card">

                <small>
                    WARTOŚĆ DROPÓW
                </small>

                <strong
                    id="crateFinalValue"
                    style="color:var(--cyan)"
                >
                    -
                </strong>

            </div>


            <div class="crate-final-card">

                <small>
                    ZYSK / STRATA
                </small>

                <strong id="crateFinalProfit">
                    -
                </strong>

            </div>


        </div>


        <!-- =========================================
             DROPY
        ========================================== -->

        <div
            class="drops-section"
            id="dropsSection"
        >
        </div>


        <!-- =========================================
             CONTENT
        ========================================== -->

        <div class="crate-content-title">

            <div class="eyebrow">
                CONTENT
            </div>

            <strong>
                Możliwe przedmioty
            </strong>

        </div>


        <div
            class="possible-items"
            id="possibleItems"
        >
        </div>


    </div>


</div>

`,

                `

// =====================================================
// =====================================================
// CRATES FRONTEND
// =====================================================
// =====================================================

const CRATE_DATA =
    ${JSON.stringify(
        publicCrates
    )};


const RARITY_DATA =
    ${JSON.stringify(
        RARITY_INFO
    )};


let selectedCrate =
    "basic";


let crateOpening =
    false;


// =====================================================
// ESCAPE
// =====================================================

function crateEscape(
    value
){

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// RARITY COLOR
// =====================================================

function crateRarityColor(
    rarity
){

    return (

        RARITY_DATA[
            rarity
        ]?.color

        ||

        "#5cecff"

    );

}


// =====================================================
// RARITY NAME
// =====================================================

function crateRarityName(
    rarity
){

    return (

        RARITY_DATA[
            rarity
        ]?.name

        ||

        String(
            rarity
        )
        .toUpperCase()

    );

}


// =====================================================
// RANDOM FAKE ITEM DO ANIMACJI
// =====================================================

function randomFakeCrateItem(
    crate
){

    return crate.items[
        Math.floor(
            Math.random()
            *
            crate.items.length
        )
    ];

}


// =====================================================
// SELECT CRATE
// =====================================================

function selectCrate(
    id,
    scroll = true
){

    const crate =
        CRATE_DATA[
            id
        ];


    if(
        !crate
    ){

        return;

    }


    selectedCrate =
        id;


    document
        .getElementById(
            "selectedCrateName"
        )
        .textContent =
        crate.name;


    document
        .getElementById(
            "singleCratePrice"
        )
        .textContent =
        money(
            crate.price
        );


    document
        .querySelectorAll(
            ".advanced-crate-card"
        )
        .forEach(
            card => {

                card.classList.toggle(

                    "selected",

                    card.dataset.crate ===
                    id

                );

            }
        );


    renderPossibleCrateItems();


    updateCratePrice();


    if(
        scroll
    ){

        document
            .getElementById(
                "crateOpener"
            )
            .scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "start"

            });

    }

}


// =====================================================
// POSSIBLE ITEMS
// =====================================================

function renderPossibleCrateItems(){

    const crate =
        CRATE_DATA[
            selectedCrate
        ];


    const holder =
        document.getElementById(
            "possibleItems"
        );


    holder.innerHTML =
        crate.items
            .map(
                item => {

                    const color =
                        crateRarityColor(
                            item.rarity
                        );


                    return (

                        '<div class="possible-item" style="border-bottom:2px solid '
                        +
                        color
                        +
                        '">'

                        +

                        '<div class="possible-icon">'
                        +
                        crateEscape(
                            item.icon
                        )
                        +
                        '</div>'

                        +

                        '<div class="possible-name">'
                        +
                        crateEscape(
                            item.name
                        )
                        +
                        '</div>'

                        +

                        '<div class="possible-rarity" style="color:'
                        +
                        color
                        +
                        '">'
                        +
                        crateEscape(
                            crateRarityName(
                                item.rarity
                            )
                        )
                        +
                        '</div>'

                        +

                        '<div class="possible-meta">'

                        +

                        '<span>'
                        +
                        Number(
                            item.chance
                        )
                        .toFixed(
                            2
                        )
                        +
                        '%</span>'

                        +

                        '<strong>'
                        +
                        money(
                            item.value
                        )
                        +
                        '</strong>'

                        +

                        '</div>'

                        +

                        '</div>'

                    );

                }
            )
            .join(
                ""
            );

}


// =====================================================
// PRICE
// =====================================================

function updateCratePrice(){

    const crate =
        CRATE_DATA[
            selectedCrate
        ];


    const count =
        Number(
            document
                .getElementById(
                    "crateCount"
                )
                .value
        );


    const cost =
        Number(
            crate.price
        )
        *
        count;


    document
        .getElementById(
            "crateTotalCost"
        )
        .textContent =
        "-"
        +
        money(
            cost
        );


    const openButton =
        document.getElementById(
            "openCrateButton"
        );


    if(
        !crateOpening
    ){

        openButton.textContent =

            "OTWÓRZ "
            +
            count
            +
            (
                count ===
                1
                    ?
                    " SKRZYNKĘ"
                    :
                    " SKRZYNEK"
            );

    }

}


// =====================================================
// COUNT
// =====================================================

document
    .getElementById(
        "crateCount"
    )
    .addEventListener(
        "change",
        updateCratePrice
    );


// =====================================================
// SELECT BUTTONS
// =====================================================

document
    .querySelectorAll(
        "[data-select-crate]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    selectCrate(
                        button.dataset.selectCrate
                    );

                }
            );

        }
    );


// =====================================================
// =====================================================
// CREATE MULTI CASE
// =====================================================
// =====================================================

function createOpeningCase(
    index,
    crate
){

    const box =
        document.createElement(
            "div"
        );


    box.className =
        "multi-case rolling";


    box.innerHTML =

        '<div class="multi-case-index">'
        +
        "#"
        +
        (
            index +
            1
        )
        +
        '</div>'

        +

        '<div class="multi-case-icon">'
        +
        crateEscape(
            crate.icon
        )
        +
        '</div>'

        +

        '<div class="multi-case-name">'
        +
        'OTWIERANIE...'
        +
        '</div>'

        +

        '<div class="multi-case-value">'
        +
        '???'
        +
        '</div>'

        +

        '<div class="multi-case-rarity">'
        +
        '7BETS'
        +
        '</div>';


    return {

        box:
            box,

        icon:
            box.querySelector(
                ".multi-case-icon"
            ),

        name:
            box.querySelector(
                ".multi-case-name"
            ),

        value:
            box.querySelector(
                ".multi-case-value"
            ),

        rarity:
            box.querySelector(
                ".multi-case-rarity"
            )

    };

}


// =====================================================
// =====================================================
// ANIMACJA WSZYSTKICH SKRZYNEK NARAZ
// =====================================================
// =====================================================

async function animateAllCrates(
    drops
){

    const crate =
        CRATE_DATA[
            selectedCrate
        ];


    const section =
        document.getElementById(
            "multiOpeningSection"
        );


    const grid =
        document.getElementById(
            "multiOpeningGrid"
        );


    const title =
        document.getElementById(
            "multiOpeningText"
        );


    section.classList.add(
        "active"
    );


    grid.innerHTML =
        "";


    grid.className =
        "multi-opening-grid count-"
        +
        drops.length;


    title.textContent =

        "Otwieranie "
        +
        drops.length
        +
        (
            drops.length ===
            1
                ?
                " skrzynki..."
                :
                " skrzynek..."
        );


    const boxes =
        [];


    // =================================================
    // TWORZYMY TYLE KAFELKÓW,
    // ILE NAPRAWDĘ OTWARTO SKRZYNEK
    // =================================================

    drops.forEach(
        (
            drop,
            index
        ) => {

            const created =
                createOpeningCase(
                    index,
                    crate
                );


            grid.appendChild(
                created.box
            );


            boxes.push({

                ...created,

                drop:
                    drop

            });

        }
    );


    // =================================================
    // PRZEWIJANIE FAKE DROPÓW
    // =================================================

    const duration =

        drops.length >=
        10

            ?

            2600

            :

            3000;


    const started =
        Date.now();


    const shuffle =
        setInterval(
            () => {

                boxes.forEach(
                    entry => {

                        const fake =
                            randomFakeCrateItem(
                                crate
                            );


                        entry.icon.textContent =
                            fake.icon;


                        entry.name.textContent =
                            fake.name;


                        entry.value.textContent =
                            money(
                                fake.value
                            );


                        entry.rarity.textContent =
                            crateRarityName(
                                fake.rarity
                            );


                        entry.rarity.style.color =
                            crateRarityColor(
                                fake.rarity
                            );

                    }
                );


                playUiSound(
                    "click"
                );


                if(
                    Date.now() -
                    started
                    >=
                    duration
                ){

                    clearInterval(
                        shuffle
                    );

                }

            },
            90
        );


    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                duration
            )
    );


    clearInterval(
        shuffle
    );


    // =================================================
    // POKAZUJEMY PRAWDZIWE DROPY
    // =================================================

    boxes.forEach(
        (
            entry,
            index
        ) => {

            setTimeout(
                () => {

                    const drop =
                        entry.drop;


                    const color =
                        drop.rarityColor
                        ||
                        crateRarityColor(
                            drop.rarity
                        );


                    entry.box.classList.remove(
                        "rolling"
                    );


                    entry.box.classList.add(
                        "finished"
                    );


                    entry.box.style.borderColor =
                        color;


                    entry.box.style.boxShadow =

                        "0 0 24px "
                        +
                        color
                        +
                        "22, inset 0 0 30px rgba(0,0,0,.25)";


                    entry.icon.textContent =
                        drop.icon;


                    entry.name.textContent =
                        drop.name;


                    entry.value.textContent =
                        money(
                            drop.value
                        );


                    entry.rarity.textContent =
                        drop.rarityName
                        ||
                        crateRarityName(
                            drop.rarity
                        );


                    entry.rarity.style.color =
                        color;


                    if(
                        [
                            "legendary",
                            "mythic",
                            "god"
                        ]
                        .includes(
                            drop.rarity
                        )
                    ){

                        playUiSound(
                            "success"
                        );

                    }

                },

                // =================================================
                // PRAWIE JEDNOCZEŚNIE
                //
                // MAŁE 15MS DAJE EFEKT FALI
                // =================================================

                index *
                15

            );

        }
    );


    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                700
            )
    );


    title.textContent =
        "Otwarto "
        +
        drops.length
        +
        (
            drops.length ===
            1
                ?
                " skrzynkę"
                :
                " skrzynek"
        );

}


// =====================================================
// =====================================================
// FINAL STATS
// =====================================================
// =====================================================

function renderCrateFinal(
    data
){

    const panel =
        document.getElementById(
            "crateFinal"
        );


    panel.classList.add(
        "active"
    );


    document
        .getElementById(
            "crateFinalCost"
        )
        .textContent =
        "-"
        +
        money(
            data.cost
        );


    document
        .getElementById(
            "crateFinalValue"
        )
        .textContent =
        "+"
        +
        money(
            data.value
        );


    const profit =
        Number(
            data.profit
        );


    const element =
        document.getElementById(
            "crateFinalProfit"
        );


    element.textContent =

        (
            profit >=
            0
                ?
                "+"
                :
                ""
        )

        +

        money(
            profit
        );


    if(
        profit >
        0
    ){

        element.style.color =
            "var(--green)";

    }

    else if(
        profit <
        0
    ){

        element.style.color =
            "var(--red)";

    }

    else{

        element.style.color =
            "var(--cyan)";

    }

}


// =====================================================
// =====================================================
// DROP CARDS
// =====================================================
// =====================================================

function renderCrateDrops(
    drops
){

    const section =
        document.getElementById(
            "dropsSection"
        );


    section.innerHTML =

        '<div class="crate-content-title">'
        +

        '<div class="eyebrow">TWÓJ DROP</div>'
        +

        '<strong>Wylosowane przedmioty</strong>'
        +

        '</div>'
        +

        '<div class="drops-grid" id="dropsGrid"></div>';


    const grid =
        document.getElementById(
            "dropsGrid"
        );


    drops.forEach(
        item => {

            const card =
                document.createElement(
                    "div"
                );


            const color =
                item.rarityColor
                ||
                crateRarityColor(
                    item.rarity
                );


            card.className =
                "drop-card";


            card.style.setProperty(
                "--drop-color",
                color
            );


            card.innerHTML =

                '<div class="drop-card-icon">'
                +
                crateEscape(
                    item.icon
                )
                +
                '</div>'

                +

                '<div class="drop-card-name">'
                +
                crateEscape(
                    item.name
                )
                +
                '</div>'

                +

                '<div class="drop-card-rarity" style="color:'
                +
                color
                +
                '">'
                +
                crateEscape(
                    item.rarityName
                    ||
                    crateRarityName(
                        item.rarity
                    )
                )
                +
                '</div>'

                +

                '<div class="drop-card-value">'
                +
                money(
                    item.value
                )
                +
                '</div>';


            grid.appendChild(
                card
            );

        }
    );

}


// =====================================================
// =====================================================
// OPEN
// =====================================================
// =====================================================

async function openCrates(){

    if(
        crateOpening
    ){

        return;

    }


    const button =
        document.getElementById(
            "openCrateButton"
        );


    const count =
        Number(
            document
                .getElementById(
                    "crateCount"
                )
                .value
        );


    crateOpening =
        true;


    button.disabled =
        true;


    button.textContent =
        "OTWIERANIE...";


    document
        .getElementById(
            "dropsSection"
        )
        .innerHTML =
        "";


    document
        .getElementById(
            "crateFinal"
        )
        .classList
        .remove(
            "active"
        );


    document
        .getElementById(
            "multiOpeningSection"
        )
        .classList
        .remove(
            "active"
        );


    // =================================================
    // REQUEST
    // =================================================

    const result =
        await api(
            "/api/crates/open",
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        crate:
                            selectedCrate,

                        count:
                            count

                    })

            }
        );


    const data =
        result.data;


    if(
        !data.ok
    ){

        crateOpening =
            false;


        button.disabled =
            false;


        updateCratePrice();


        // =================================================
        // JEŚLI API ZWRÓCIŁO SALDO,
        // TEŻ JE AKTUALIZUJEMY
        // =================================================

        if(
            Number.isFinite(
                Number(
                    data.saldo
                )
            )
        ){

            updateBalance(
                data.saldo
            );

        }


        showNotification(

            "error",

            "Skrzynki",

            data.message ||
            "Nie udało się otworzyć skrzynki."

        );


        return;

    }


    // =================================================
    // NAJWAŻNIEJSZE:
    // SALDO AKTUALIZUJE SIĘ OD RAZU
    // =================================================

    updateBalance(
        data.saldo
    );


    // =================================================
    // ANIMUJEMY KAŻDY DROP OSOBNO
    // =================================================

    await animateAllCrates(
        data.drops
    );


    renderCrateFinal(
        data
    );


    renderCrateDrops(
        data.drops
    );


    crateOpening =
        false;


    button.disabled =
        false;


    updateCratePrice();


    // =================================================
    // JESZCZE RAZ ODPYTUJEMY SERWER
    // ŻEBY SALDO ZAWSZE BYŁO ZGODNE
    // =================================================

    setTimeout(
        refreshBalance,
        250
    );


    if(
        Number(
            data.profit
        )
        >
        0
    ){

        showNotification(

            "win",

            "Skrzynki otwarte!",

            "Zysk: +"
            +
            money(
                data.profit
            )

        );

    }

    else if(
        Number(
            data.profit
        )
        <
        0
    ){

        showNotification(

            "info",

            "Skrzynki otwarte",

            "Strata: "
            +
            money(
                Math.abs(
                    data.profit
                )
            )

        );

    }

    else{

        showNotification(

            "success",

            "Skrzynki otwarte",

            "Wyszedłeś na zero."

        );

    }

}


// =====================================================
// BUTTON
// =====================================================

document
    .getElementById(
        "openCrateButton"
    )
    .addEventListener(
        "click",
        openCrates
    );


// =====================================================
// INITIAL
// =====================================================

selectCrate(
    "basic",
    false
);

`

            )

        );

    }
);


// =====================================================
// =====================================================
// KONIEC SERVER.JS V7 — 3/6
// =====================================================
//
// 4/6:
//
// 💣 MINER
// 🗼 TOWER
//
// MINER:
//
// ✅ STAWKA
// ✅ BOMBY
// ✅ ODKRYTE POLA
// ✅ MNOŻNIK
//
// ✅ AKTUALNY ZYSK
// ✅ DO WYPŁATY
//
// ✅ PO TRAFIENIU BOMBY:
//    POKAŻE WSZYSTKIE BOMBY
//
// ✅ LUCK MOŻE URATOWAĆ
//
// ✅ SALDO AKTUALIZUJE SIĘ OD RAZU
//
// TOWER:
//
// ✅ POZIOMY
// ✅ BOMBOWE POLA
// ✅ CASHOUT
// ✅ LUCK
// ✅ SALDO LIVE
//
// NIE DODAWAJ app.listen()
//
// =====================================================
// =====================================================
// =====================================================
//                  7BETS SERVER
//                 POPRAWIONY V7
// =====================================================
// =====================================================
//
// SERVER.JS — CZĘŚĆ 4/6
//
// 💣 MINER
// 🗼 TOWER
//
// MINER:
//
// ✅ STAWKA
// ✅ 1 / 3 / 5 / 8 / 12 BOMB
// ✅ ODKRYTE POLA
// ✅ MNOŻNIK
// ✅ AKTUALNY ZYSK
// ✅ DO WYPŁATY
//
// ✅ PO TRAFIENIU BOMBY:
//    POKAZUJE WSZYSTKIE BOMBY
//
// ✅ LUCK MOŻE URATOWAĆ
//
// ✅ SALDO:
//    updateBalance(data.saldo)
//
// ✅ AUTOMATYCZNY refreshBalance()
//
// TOWER:
//
// ✅ 8 POZIOMÓW
// ✅ 1 / 2 BOMBY
// ✅ MNOŻNIK
// ✅ AKTUALNY ZYSK
// ✅ CASHOUT
// ✅ LUCK
// ✅ SALDO LIVE
//
// WKLEJ POD 3/6
//
// NIE DODAWAJ JESZCZE app.listen()
//
// =====================================================


// =====================================================
// =====================================================
// AKTYWNE RUNDY
// =====================================================
// =====================================================

const minerRounds =
    new Map();


const towerRounds =
    new Map();


const TOWER_LEVELS =
    8;


// =====================================================
// =====================================================
// COMMON GAME PAGE
// =====================================================
// =====================================================

function v7GamePage(
    req,
    res,
    title,
    subtitle,
    gameKey,
    body,
    script = ""
){

    const account =
        getSessionUser(
            req
        );


    if(
        !account
    ){

        return res.redirect(
            "/login"
        );

    }


    const {

        users,
        user,
        login

    } =
        account;


    ensureStats(
        user,
        login
    );


    if(
        user.blocked ===
        true
    ){

        return req.session.destroy(
            () => {

                res.redirect(
                    "/login"
                );

            }
        );

    }


    if(
        user.polaczono !==
        true
    ){

        return res.redirect(
            "/panel"
        );

    }


    saveUsers(
        users
    );


    return res.send(

        layout(

            title,

            `

<style>

/* =====================================================
   GAME PAGE
===================================================== */

.v7-game-wrap{

    margin-top:25px;

}


.v7-game-card{

    padding:24px;

}


.v7-game-header{

    display:flex;

    align-items:center;

    justify-content:space-between;

    gap:15px;

    flex-wrap:wrap;

    margin-bottom:22px;

}


.v7-game-header h1{

    margin:
        3px 0 5px;

    font-size:
        clamp(
            38px,
            7vw,
            72px
        );

    line-height:.9;

    letter-spacing:-4px;

}


.v7-game-header p{

    margin:0;

    color:
        var(--muted);

}


/* =====================================================
   CONTROLS
===================================================== */

.v7-game-controls{

    display:grid;

    grid-template-columns:
        1fr 1fr auto auto;

    gap:10px;

    align-items:end;

    margin-bottom:17px;

}


.v7-control small{

    display:block;

    margin-bottom:7px;

    color:#718c95;

    font-size:9px;

    font-weight:1000;

    letter-spacing:1px;

}


.v7-game-button{

    min-width:120px;

}


/* =====================================================
   STAT GRID
===================================================== */

.v7-stat-grid{

    display:grid;

    grid-template-columns:
        repeat(
            5,
            1fr
        );

    gap:8px;

    margin-bottom:20px;

}


.v7-stat{

    min-height:82px;

    display:flex;

    flex-direction:column;

    justify-content:center;

    padding:13px;

    border-radius:11px;

    border:
        1px solid
        rgba(255,255,255,.045);

    background:
        rgba(255,255,255,.022);

}


.v7-stat small{

    display:block;

    margin-bottom:5px;

    color:#66818a;

    font-size:8px;

    font-weight:1000;

}


.v7-stat strong{

    font-size:
        clamp(
            15px,
            2.8vw,
            21px
        );

}


.v7-cyan{

    color:
        var(--cyan);

}


.v7-green{

    color:
        var(--green);

}


.v7-red{

    color:
        var(--red);

}


.v7-yellow{

    color:
        var(--yellow);

}


/* =====================================================
   GAME STATUS
===================================================== */

.v7-info-bar{

    display:flex;

    align-items:center;

    justify-content:space-between;

    gap:10px;

    flex-wrap:wrap;

    margin-top:17px;

    padding:12px 14px;

    border-radius:11px;

    border:
        1px solid
        rgba(255,255,255,.045);

    background:
        rgba(255,255,255,.02);

}


.v7-info-bar span{

    color:#738f98;

    font-size:10px;

}


.v7-luck{

    padding:
        7px 10px;

    border-radius:999px;

    color:
        var(--yellow);

    font-size:9px;

    font-weight:1000;

    border:
        1px solid
        rgba(255,209,102,.17);

    background:
        rgba(255,209,102,.05);

}


/* =====================================================
   MINER
===================================================== */

.v7-miner-board{

    width:
        min(
            660px,
            100%
        );

    margin:
        8px auto;

    display:grid;

    grid-template-columns:
        repeat(
            5,
            1fr
        );

    gap:9px;

}


.v7-mine-cell{

    aspect-ratio:1;

    min-height:60px;

    padding:0;

    position:relative;

    overflow:hidden;

    display:grid;

    place-items:center;

    border-radius:13px;

    border:
        1px solid
        rgba(92,236,255,.11);

    color:#7cb6c4;

    font-size:
        clamp(
            21px,
            4vw,
            30px
        );

    background:

        radial-gradient(
            circle at 50% 0%,
            rgba(92,236,255,.06),
            transparent 65%
        ),

        linear-gradient(
            145deg,
            #0c2936,
            #061720
        );

    box-shadow:

        inset 0 1px 0
        rgba(255,255,255,.025),

        0 8px 20px
        rgba(0,0,0,.12);

    transition:
        transform .15s ease,
        border-color .15s ease,
        box-shadow .15s ease;

}


.v7-mine-cell:hover:not(:disabled){

    transform:
        translateY(-2px)
        scale(1.02);

    border-color:
        rgba(92,236,255,.40);

    box-shadow:

        0 0 25px
        rgba(92,236,255,.07);

}


.v7-mine-cell.safe{

    color:
        var(--cyan);

    border-color:
        rgba(85,245,179,.25);

    background:

        radial-gradient(
            circle,
            rgba(85,245,179,.13),
            transparent 70%
        ),

        #071b1d;

}


.v7-mine-cell.bomb{

    color:#fff;

    border-color:
        rgba(255,104,123,.35);

    background:

        radial-gradient(
            circle,
            rgba(255,104,123,.22),
            transparent 70%
        ),

        #1b080c;

    animation:
        v7BombPop
        .34s ease;

}


.v7-mine-cell.hit-bomb{

    box-shadow:

        0 0 35px
        rgba(255,104,123,.40);

}


.v7-mine-cell.luck-save{

    color:
        var(--yellow);

    border-color:
        rgba(255,209,102,.40);

    background:

        radial-gradient(
            circle,
            rgba(255,209,102,.20),
            transparent 70%
        ),

        #171307;

    box-shadow:

        0 0 30px
        rgba(255,209,102,.10);

}


@keyframes v7BombPop{

    0%{

        transform:
            scale(.65);

    }

    55%{

        transform:
            scale(1.12);

    }

    100%{

        transform:
            scale(1);

    }

}


/* =====================================================
   TOWER
===================================================== */

.v7-tower-board{

    width:
        min(
            730px,
            100%
        );

    margin:
        10px auto;

    display:flex;

    flex-direction:
        column-reverse;

    gap:8px;

}


.v7-tower-row{

    display:grid;

    grid-template-columns:
        60px
        repeat(
            3,
            1fr
        );

    gap:8px;

    opacity:.30;

    transition:.20s ease;

}


.v7-tower-row.active{

    opacity:1;

    transform:
        scale(1.012);

}


.v7-tower-row.done{

    opacity:.60;

}


.v7-level{

    min-height:56px;

    display:grid;

    place-items:center;

    border-radius:10px;

    color:#69858e;

    font-size:9px;

    font-weight:1000;

    border:
        1px solid
        rgba(255,255,255,.04);

    background:
        rgba(255,255,255,.02);

}


.v7-tower-cell{

    min-height:56px;

    padding:0;

    display:grid;

    place-items:center;

    border-radius:11px;

    border:
        1px solid
        rgba(92,236,255,.11);

    color:#77aeba;

    font-size:22px;

    background:

        linear-gradient(
            145deg,
            #0c2936,
            #061720
        );

    transition:.15s ease;

}


.v7-tower-row.active
.v7-tower-cell:hover:not(:disabled){

    transform:
        translateY(-2px);

    border-color:
        rgba(92,236,255,.38);

}


.v7-tower-cell.safe{

    color:
        var(--cyan);

    border-color:
        rgba(85,245,179,.25);

    background:
        rgba(85,245,179,.08);

}


.v7-tower-cell.bomb{

    border-color:
        rgba(255,104,123,.32);

    background:
        rgba(255,104,123,.12);

}


.v7-tower-cell.luck-save{

    color:
        var(--yellow);

    border-color:
        rgba(255,209,102,.38);

    background:
        rgba(255,209,102,.10);

}


/* =====================================================
   RESPONSIVE
===================================================== */

@media(max-width:920px){

    .v7-game-controls{

        grid-template-columns:
            1fr 1fr;

    }


    .v7-stat-grid{

        grid-template-columns:
            repeat(
                3,
                1fr
            );

    }

}


@media(max-width:620px){

    .v7-game-controls{

        grid-template-columns:
            1fr;

    }


    .v7-stat-grid{

        grid-template-columns:
            repeat(
                2,
                1fr
            );

    }


    .v7-game-card{

        padding:14px;

    }


    .v7-tower-row{

        grid-template-columns:
            43px
            repeat(
                3,
                1fr
            );

    }


    .v7-level,
    .v7-tower-cell{

        min-height:46px;

    }

}

</style>


<div class="shell">


    ${topbar(
        user
    )}


    <div class="v7-game-wrap">


        <div class="glass v7-game-card">


            <div class="v7-game-header">


                <div>

                    <div class="eyebrow">
                        7BETS • GAME
                    </div>


                    <h1>
                        ${esc(
                            title
                        )}
                    </h1>


                    <p>
                        ${esc(
                            subtitle
                        )}
                    </p>

                </div>


                <a
                    href="/panel"
                    class="btn secondary"
                >
                    ← WRÓĆ
                </a>


            </div>


            ${body}


        </div>


    </div>


</div>

`,

            script

        )

    );

}


// =====================================================
// =====================================================
// LUCK SAVE
// =====================================================
// =====================================================

function luckSavedFromBomb(){

    if(
        !isLuckActive()
    ){

        return false;

    }


    const boost =
        getLuckBoost();


    // x1.35 = około 17.5%
    // x2.00 = max 35%

    const chance =
        Math.min(

            .35,

            Math.max(

                .10,

                (
                    boost -
                    1
                )
                *
                .50

            )

        );


    return (
        Math.random() <
        chance
    );

}


// =====================================================
// =====================================================
// MINER — BOMBY
// =====================================================
// =====================================================

function generateMinerBombs(
    amount
){

    const bombs =
        new Set();


    while(
        bombs.size <
        amount
    ){

        bombs.add(

            randInt(
                0,
                24
            )

        );

    }


    return bombs;

}


// =====================================================
// MINER — RELOCATE BOMB
// =====================================================

function relocateMinerBomb(
    round,
    index
){

    round.bombSet.delete(
        index
    );


    const available =
        [];


    for(
        let i = 0;
        i < 25;
        i++
    ){

        if(
            i ===
            index
        ){

            continue;

        }


        if(
            round.revealed.has(
                i
            )
        ){

            continue;

        }


        if(
            round.bombSet.has(
                i
            )
        ){

            continue;

        }


        available.push(
            i
        );

    }


    if(
        available.length >
        0
    ){

        round.bombSet.add(

            randomItem(
                available
            )

        );

    }

}


// =====================================================
// =====================================================
// MINER MULTIPLIER
// =====================================================
// =====================================================
//
// Im więcej bomb,
// tym szybciej rośnie mnożnik.
//
// =====================================================

function minerMultiplier(
    round
){

    const opened =
        round.revealed.size;


    if(
        opened <=
        0
    ){

        return 1;

    }


    const safeFields =
        25 -
        round.bombs;


    const risk =
        round.bombs /
        safeFields;


    const growth =
        (
            opened /
            safeFields
        )
        *
        (
            1.05
            +
            risk *
            4.3
        );


    const base =
        1 +
        growth;


    return roundMoney(
        Math.max(
            1.01,
            base
        )
    );

}


// =====================================================
// MINER PAYOUT
// =====================================================

function minerPayoutData(
    round
){

    const multiplier =
        minerMultiplier(
            round
        );


    // MONEY x2 / x3 działa na WYGRANĄ,
    // a nie na samą stawkę.

    const normalProfit =
        round.bet
        *
        (
            multiplier -
            1
        );


    const eventProfit =
        normalProfit
        *
        getMoneyMultiplier();


    const payout =
        roundMoney(

            round.bet
            +
            eventProfit

        );


    const profit =
        roundMoney(
            payout -
            round.bet
        );


    const displayMultiplier =
        roundMoney(
            payout /
            round.bet
        );


    return {

        multiplier:
            displayMultiplier,

        payout:
            payout,

        profit:
            profit,

        eventMultiplier:
            getMoneyMultiplier()

    };

}


// =====================================================
// =====================================================
// MINER PAGE
// =====================================================
// =====================================================

app.get(
    "/game/miner",
    (
        req,
        res
    ) => {

        return v7GamePage(

            req,

            res,

            "Miner",

            "Odkrywaj bezpieczne pola. Im więcej odkryjesz, tym większy zysk.",

            "miner",

            `

<div class="v7-game-controls">


    <div class="v7-control">

        <small>
            STAWKA
        </small>

        <input
            id="minerBet"
            type="number"
            min="1"
            step="1"
            value="10"
        >

    </div>


    <div class="v7-control">

        <small>
            LICZBA BOMB
        </small>

        <select id="minerBombs">

            <option value="1">
                1 bomba
            </option>

            <option value="3">
                3 bomby
            </option>

            <option
                value="5"
                selected
            >
                5 bomb
            </option>

            <option value="8">
                8 bomb
            </option>

            <option value="12">
                12 bomb
            </option>

        </select>

    </div>


    <button
        id="minerStart"
        class="v7-game-button"
    >
        START
    </button>


    <button
        id="minerCashout"
        class="v7-game-button"
        disabled
    >
        WYPŁAĆ
    </button>


</div>


<!-- =============================================
     STATS
============================================== -->

<div class="v7-stat-grid">


    <div class="v7-stat">

        <small>
            STAWKA
        </small>

        <strong id="minerStatBet">
            0,00 zł
        </strong>

    </div>


    <div class="v7-stat">

        <small>
            ODKRYTE POLA
        </small>

        <strong
            id="minerStatOpened"
            class="v7-cyan"
        >
            0
        </strong>

    </div>


    <div class="v7-stat">

        <small>
            MNOŻNIK
        </small>

        <strong
            id="minerStatMultiplier"
            class="v7-cyan"
        >
            x1.00
        </strong>

    </div>


    <div class="v7-stat">

        <small>
            AKTUALNY ZYSK
        </small>

        <strong
            id="minerStatProfit"
            class="v7-green"
        >
            +0,00 zł
        </strong>

    </div>


    <div class="v7-stat">

        <small>
            DO WYPŁATY
        </small>

        <strong
            id="minerStatPayout"
            class="v7-green"
        >
            0,00 zł
        </strong>

    </div>


</div>


<!-- =============================================
     BOARD
============================================== -->

<div
    class="v7-miner-board"
    id="minerBoard"
>
</div>


<div class="v7-info-bar">


    <span id="minerInfo">

        Kliknij START,
        a następnie odkrywaj pola.

    </span>


    ${
        isLuckActive()

            ?

            `

<div class="v7-luck">

    🍀 LUCK ACTIVE

    • x${getLuckBoost().toFixed(2)}

</div>

`

            :

            `

<span>
    🍀 LUCK: OFF
</span>

`

    }


</div>

`,

            `

// =====================================================
// =====================================================
// MINER FRONTEND
// =====================================================
// =====================================================

let minerRoundToken =
    null;


let minerActive =
    false;


let minerBetValue =
    0;


let minerOpened =
    0;


let minerMultiplierValue =
    1;


let minerPayoutValue =
    0;


let minerProfitValue =
    0;


const minerBoard =
    document.getElementById(
        "minerBoard"
    );


const minerStart =
    document.getElementById(
        "minerStart"
    );


const minerCashout =
    document.getElementById(
        "minerCashout"
    );


const minerBetInput =
    document.getElementById(
        "minerBet"
    );


const minerBombsInput =
    document.getElementById(
        "minerBombs"
    );


// =====================================================
// BUILD BOARD
// =====================================================

function buildMinerBoard(){

    minerBoard.innerHTML =
        "";


    for(
        let i = 0;
        i < 25;
        i++
    ){

        const cell =
            document.createElement(
                "button"
            );


        cell.type =
            "button";


        cell.className =
            "v7-mine-cell";


        cell.dataset.index =
            i;


        cell.textContent =
            "◆";


        cell.disabled =
            !minerActive;


        cell.addEventListener(
            "click",
            () => {

                minerReveal(
                    i,
                    cell
                );

            }
        );


        minerBoard.appendChild(
            cell
        );

    }

}


// =====================================================
// STATS
// =====================================================

function updateMinerStats(){

    document
        .getElementById(
            "minerStatBet"
        )
        .textContent =
        money(
            minerBetValue
        );


    document
        .getElementById(
            "minerStatOpened"
        )
        .textContent =
        minerOpened;


    document
        .getElementById(
            "minerStatMultiplier"
        )
        .textContent =
        "x"
        +
        Number(
            minerMultiplierValue
        )
        .toFixed(
            2
        );


    const profitElement =
        document.getElementById(
            "minerStatProfit"
        );


    profitElement.textContent =

        (
            minerProfitValue >=
            0
                ?
                "+"
                :
                ""
        )

        +

        money(
            minerProfitValue
        );


    profitElement.className =

        minerProfitValue >
        0

            ?

            "v7-green"

            :

            minerProfitValue <
            0

                ?

                "v7-red"

                :

                "v7-cyan";


    document
        .getElementById(
            "minerStatPayout"
        )
        .textContent =
        money(
            minerPayoutValue
        );

}


// =====================================================
// DISABLE BOARD
// =====================================================

function disableMinerBoard(){

    document
        .querySelectorAll(
            ".v7-mine-cell"
        )
        .forEach(
            cell => {

                cell.disabled =
                    true;

            }
        );

}


// =====================================================
// START
// =====================================================

minerStart.addEventListener(
    "click",
    async () => {

        if(
            minerActive
        ){

            return;

        }


        minerStart.disabled =
            true;


        const result =
            await api(
                "/api/miner/start",
                {

                    method:
                        "POST",

                    body:
                        JSON.stringify({

                            bet:
                                Number(
                                    minerBetInput.value
                                ),

                            bombs:
                                Number(
                                    minerBombsInput.value
                                )

                        })

                }
            );


        const data =
            result.data;


        if(
            !data.ok
        ){

            minerStart.disabled =
                false;


            if(
                Number.isFinite(
                    Number(
                        data.saldo
                    )
                )
            ){

                updateBalance(
                    data.saldo
                );

            }


            showNotification(

                "error",

                "Miner",

                data.message ||
                "Nie udało się rozpocząć gry."

            );


            return;

        }


        minerRoundToken =
            data.token;


        minerActive =
            true;


        minerBetValue =
            Number(
                data.bet
            );


        minerOpened =
            0;


        minerMultiplierValue =
            1;


        minerPayoutValue =
            0;


        minerProfitValue =
            0;


        minerCashout.disabled =
            true;


        minerBetInput.disabled =
            true;


        minerBombsInput.disabled =
            true;


        updateBalance(
            data.saldo
        );


        buildMinerBoard();


        updateMinerStats();


        document
            .getElementById(
                "minerInfo"
            )
            .textContent =
            "Runda aktywna • wybierz bezpieczne pole.";


        showNotification(

            "success",

            "Miner rozpoczęty",

            "Pobrano stawkę "
            +
            money(
                data.bet
            )
            +
            "."

        );


        setTimeout(
            refreshBalance,
            200
        );

    }
);


// =====================================================
// REVEAL
// =====================================================

async function minerReveal(
    index,
    cell
){

    if(
        !minerActive
        ||
        cell.disabled
    ){

        return;

    }


    cell.disabled =
        true;


    const result =
        await api(
            "/api/miner/reveal",
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        token:
                            minerRoundToken,

                        index:
                            index

                    })

            }
        );


    const data =
        result.data;


    if(
        !data.ok
    ){

        cell.disabled =
            false;


        if(
            Number.isFinite(
                Number(
                    data.saldo
                )
            )
        ){

            updateBalance(
                data.saldo
            );

        }


        showNotification(

            "error",

            "Miner",

            data.message ||
            "Nie udało się odkryć pola."

        );


        return;

    }


    // =================================================
    // BOMBA
    // =================================================

    if(
        data.bomb ===
        true
    ){

        minerActive =
            false;


        minerCashout.disabled =
            true;


        minerStart.disabled =
            false;


        minerBetInput.disabled =
            false;


        minerBombsInput.disabled =
            false;


        const cells =
            Array.from(
                document.querySelectorAll(
                    ".v7-mine-cell"
                )
            );


        // =============================================
        // POKAZUJEMY WSZYSTKIE BOMBY
        // =============================================

        cells.forEach(
            (
                element,
                cellIndex
            ) => {

                element.disabled =
                    true;


                if(
                    Array.isArray(
                        data.bombs
                    )
                    &&
                    data.bombs.includes(
                        cellIndex
                    )
                ){

                    element.textContent =
                        "💣";


                    element.classList.add(
                        "bomb"
                    );

                }

            }
        );


        // trafiona bomba

        cell.textContent =
            "💥";


        cell.classList.add(
            "bomb",
            "hit-bomb"
        );


        minerPayoutValue =
            0;


        minerProfitValue =
            -minerBetValue;


        updateMinerStats();


        updateBalance(
            data.saldo
        );


        document
            .getElementById(
                "minerInfo"
            )
            .textContent =
            "Trafiłeś bombę • wszystkie bomby zostały pokazane.";


        showNotification(

            "loss",

            "BUM!",

            "Straciłeś "
            +
            money(
                minerBetValue
            )
            +
            "."

        );


        setTimeout(
            refreshBalance,
            200
        );


        return;

    }


    // =================================================
    // SAFE / LUCK SAVE
    // =================================================

    minerOpened =
        Number(
            data.opened || 0
        );


    minerMultiplierValue =
        Number(
            data.multiplier || 1
        );


    minerPayoutValue =
        Number(
            data.payout || 0
        );


    minerProfitValue =
        Number(
            data.profit || 0
        );


    if(
        data.luckSaved ===
        true
    ){

        cell.textContent =
            "🍀";


        cell.classList.add(
            "luck-save"
        );


        showNotification(

            "reward",

            "LUCK uratował!",

            "To pole było bombą, ale event Cię uratował."

        );

    }

    else{

        cell.textContent =
            "💎";


        cell.classList.add(
            "safe"
        );

    }


    updateMinerStats();


    minerCashout.disabled =
        false;


    document
        .getElementById(
            "minerInfo"
        )
        .textContent =

        "Aktualny zysk: "
        +
        (
            minerProfitValue >= 0
                ?
                "+"
                :
                ""
        )
        +
        money(
            minerProfitValue
        )
        +
        " • wypłata "
        +
        money(
            minerPayoutValue
        );


    // =================================================
    // AUTOMATYCZNA WYGRANA
    // =================================================

    if(
        data.completed ===
        true
    ){

        minerActive =
            false;


        minerCashout.disabled =
            true;


        minerStart.disabled =
            false;


        minerBetInput.disabled =
            false;


        minerBombsInput.disabled =
            false;


        disableMinerBoard();


        updateBalance(
            data.saldo
        );


        showNotification(

            "win",

            "Miner ukończony!",

            "Wypłacono "
            +
            money(
                data.payout
            )
            +
            " • zysk +"
            +
            money(
                data.profit
            )

        );


        setTimeout(
            refreshBalance,
            200
        );

    }

}


// =====================================================
// CASHOUT
// =====================================================

minerCashout.addEventListener(
    "click",
    async () => {

        if(
            !minerActive
        ){

            return;

        }


        minerCashout.disabled =
            true;


        const result =
            await api(
                "/api/miner/cashout",
                {

                    method:
                        "POST",

                    body:
                        JSON.stringify({

                            token:
                                minerRoundToken

                        })

                }
            );


        const data =
            result.data;


        if(
            !data.ok
        ){

            minerCashout.disabled =
                false;


            showNotification(

                "error",

                "Miner",

                data.message ||
                "Nie udało się wypłacić."

            );


            return;

        }


        minerActive =
            false;


        minerStart.disabled =
            false;


        minerBetInput.disabled =
            false;


        minerBombsInput.disabled =
            false;


        minerMultiplierValue =
            Number(
                data.multiplier || 1
            );


        minerPayoutValue =
            Number(
                data.payout || 0
            );


        minerProfitValue =
            Number(
                data.profit || 0
            );


        disableMinerBoard();


        updateMinerStats();


        // =============================================
        // SALDO OD RAZU
        // =============================================

        updateBalance(
            data.saldo
        );


        document
            .getElementById(
                "minerInfo"
            )
            .textContent =

            "Wypłacono "
            +
            money(
                data.payout
            )
            +
            ".";


        showNotification(

            "win",

            "Wypłacono!",

            money(
                data.payout
            )
            +
            " • zysk "
            +
            (
                data.profit >=
                0
                    ?
                    "+"
                    :
                    ""
            )
            +
            money(
                data.profit
            )

        );


        setTimeout(
            refreshBalance,
            200
        );

    }
);


// =====================================================
// INITIAL
// =====================================================

buildMinerBoard();


updateMinerStats();

`

        );

    }
);


// =====================================================
// =====================================================
// MINER START API
// =====================================================
// =====================================================

app.post(
    "/api/miner/start",
    (
        req,
        res
    ) => {

        if(
            !requireGameAvailable(
                req,
                res,
                "miner"
            )
        ){

            return;

        }


        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user,
            login

        } =
            account;


        const settings =
            loadSettings();


        if(
            settings.economyEnabled !==
            true
        ){

            return res.status(
                503
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Ekonomia jest obecnie wyłączona."

            });

        }


        const validation =
            validateBet(
                user,
                req.body?.bet
            );


        if(
            !validation.ok
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    validation.message

            });

        }


        const bombs =
            Number(
                req.body?.bombs
            );


        if(
            ![
                1,
                3,
                5,
                8,
                12
            ]
            .includes(
                bombs
            )
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Nieprawidłowa liczba bomb."

            });

        }


        // =================================================
        // AKTYWNA RUNDA?
        // =================================================

        for(
            const round
            of minerRounds.values()
        ){

            if(
                round.login ===
                login
            ){

                return res.status(
                    409
                )
                .json({

                    ok:false,

                    saldo:
                        user.saldo,

                    message:
                        "Masz już aktywną rundę Miner."

                });

            }

        }


        const bet =
            validation.bet;


        user.saldo =
            roundMoney(
                user.saldo -
                bet
            );


        const token =
            crypto
                .randomBytes(
                    24
                )
                .toString(
                    "hex"
                );


        minerRounds.set(

            token,

            {

                token:
                    token,

                login:
                    login,

                bet:
                    bet,

                bombs:
                    bombs,

                bombSet:
                    generateMinerBombs(
                        bombs
                    ),

                revealed:
                    new Set(),

                createdAt:
                    Date.now()

            }

        );


        saveUsers(
            users
        );


        addLog(

            login,

            "miner_start",

            login,

            "Stawka "
            +
            formatMoney(
                bet
            )
            +
            " | bomby "
            +
            bombs

        );


        return res.json({

            ok:true,

            token:
                token,

            bet:
                bet,

            bombs:
                bombs,

            saldo:
                user.saldo,

            luck:
                isLuckActive(),

            moneyMultiplier:
                getMoneyMultiplier()

        });

    }
);


// =====================================================
// =====================================================
// MINER REVEAL API
// =====================================================
// =====================================================

app.post(
    "/api/miner/reveal",
    (
        req,
        res
    ) => {

        if(
            !requireGameAvailable(
                req,
                res,
                "miner"
            )
        ){

            return;

        }


        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user,
            login

        } =
            account;


        const token =
            String(
                req.body?.token || ""
            );


        const index =
            Number(
                req.body?.index
            );


        const round =
            minerRounds.get(
                token
            );


        if(
            !round
            ||
            round.login !==
            login
        ){

            return res.status(
                404
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Ta runda już nie istnieje."

            });

        }


        if(
            !Number.isInteger(
                index
            )
            ||
            index <
            0
            ||
            index >
            24
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Nieprawidłowe pole."

            });

        }


        if(
            round.revealed.has(
                index
            )
        ){

            return res.status(
                409
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "To pole zostało już odkryte."

            });

        }


        // =================================================
        // TRAFIENIE BOMBY
        // =================================================

        if(
            round.bombSet.has(
                index
            )
        ){

            // =================================================
            // LUCK SAVE
            // =================================================

            if(
                luckSavedFromBomb()
            ){

                relocateMinerBomb(
                    round,
                    index
                );


                round.revealed.add(
                    index
                );


                const payoutData =
                    minerPayoutData(
                        round
                    );


                return res.json({

                    ok:true,

                    bomb:false,

                    luckSaved:true,

                    completed:false,

                    opened:
                        round.revealed.size,

                    multiplier:
                        payoutData.multiplier,

                    payout:
                        payoutData.payout,

                    profit:
                        payoutData.profit,

                    eventMultiplier:
                        payoutData.eventMultiplier,

                    saldo:
                        user.saldo

                });

            }


            // =================================================
            // PRZEGRANA
            // =================================================

            const allBombs =
                Array.from(
                    round.bombSet
                );


            recordGame(
                user,
                -round.bet,
                "miner"
            );


            minerRounds.delete(
                token
            );


            saveUsers(
                users
            );


            addLog(

                login,

                "miner_loss",

                login,

                "-"
                +
                formatMoney(
                    round.bet
                )

            );


            return res.json({

                ok:true,

                bomb:true,

                hitIndex:
                    index,

                // =============================================
                // FRONTEND POKAŻE WSZYSTKIE BOMBY
                // =============================================

                bombs:
                    allBombs,

                payout:
                    0,

                profit:
                    -round.bet,

                saldo:
                    user.saldo

            });

        }


        // =================================================
        // SAFE
        // =================================================

        round.revealed.add(
            index
        );


        const payoutData =
            minerPayoutData(
                round
            );


        const safeFields =
            25 -
            round.bombs;


        // =================================================
        // WSZYSTKIE SAFE ODKRYTE
        // =================================================

        if(
            round.revealed.size >=
            safeFields
        ){

            user.saldo =
                roundMoney(

                    user.saldo
                    +
                    payoutData.payout

                );


            recordGame(
                user,
                payoutData.profit,
                "miner"
            );


            minerRounds.delete(
                token
            );


            saveUsers(
                users
            );


            return res.json({

                ok:true,

                bomb:false,

                luckSaved:false,

                completed:true,

                opened:
                    round.revealed.size,

                multiplier:
                    payoutData.multiplier,

                payout:
                    payoutData.payout,

                profit:
                    payoutData.profit,

                eventMultiplier:
                    payoutData.eventMultiplier,

                saldo:
                    user.saldo

            });

        }


        return res.json({

            ok:true,

            bomb:false,

            luckSaved:false,

            completed:false,

            opened:
                round.revealed.size,

            multiplier:
                payoutData.multiplier,

            payout:
                payoutData.payout,

            profit:
                payoutData.profit,

            eventMultiplier:
                payoutData.eventMultiplier,

            saldo:
                user.saldo

        });

    }
);


// =====================================================
// =====================================================
// MINER CASHOUT
// =====================================================
// =====================================================

app.post(
    "/api/miner/cashout",
    (
        req,
        res
    ) => {

        if(
            !requireGameAvailable(
                req,
                res,
                "miner"
            )
        ){

            return;

        }


        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user,
            login

        } =
            account;


        const token =
            String(
                req.body?.token || ""
            );


        const round =
            minerRounds.get(
                token
            );


        if(
            !round
            ||
            round.login !==
            login
        ){

            return res.status(
                404
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Ta runda już nie istnieje."

            });

        }


        if(
            round.revealed.size <
            1
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Najpierw odkryj przynajmniej jedno pole."

            });

        }


        const data =
            minerPayoutData(
                round
            );


        user.saldo =
            roundMoney(

                user.saldo
                +
                data.payout

            );


        recordGame(
            user,
            data.profit,
            "miner"
        );


        minerRounds.delete(
            token
        );


        saveUsers(
            users
        );


        addLog(

            login,

            "miner_cashout",

            login,

            "Wypłata "
            +
            formatMoney(
                data.payout
            )
            +
            " | profit "
            +
            formatMoney(
                data.profit
            )

        );


        return res.json({

            ok:true,

            multiplier:
                data.multiplier,

            payout:
                data.payout,

            profit:
                data.profit,

            eventMultiplier:
                data.eventMultiplier,

            saldo:
                user.saldo

        });

    }
);


// =====================================================
// =====================================================
// TOWER — GENERATE ROWS
// =====================================================
// =====================================================

function generateTowerRows(
    bombsPerRow
){

    const rows =
        [];


    for(
        let level = 0;
        level < TOWER_LEVELS;
        level++
    ){

        const bombs =
            new Set();


        while(
            bombs.size <
            bombsPerRow
        ){

            bombs.add(

                randInt(
                    0,
                    2
                )

            );

        }


        rows.push(
            bombs
        );

    }


    return rows;

}


// =====================================================
// TOWER RELOCATE
// =====================================================

function relocateTowerBomb(
    round,
    level,
    selectedCell
){

    const row =
        round.rows[
            level
        ];


    row.delete(
        selectedCell
    );


    const available =
        [];


    for(
        let i = 0;
        i < 3;
        i++
    ){

        if(
            i ===
            selectedCell
        ){

            continue;

        }


        if(
            !row.has(
                i
            )
        ){

            available.push(
                i
            );

        }

    }


    if(
        available.length >
        0
    ){

        row.add(

            randomItem(
                available
            )

        );

    }

}


// =====================================================
// =====================================================
// TOWER MULTIPLIER
// =====================================================
// =====================================================

function towerPayoutData(
    round
){

    const level =
        round.level;


    if(
        level <
        1
    ){

        return {

            multiplier:
                1,

            payout:
                0,

            profit:
                0,

            eventMultiplier:
                getMoneyMultiplier()

        };

    }


    const growth =
        round.bombsPerRow ===
        1
            ?
            .42
            :
            1.10;


    const rawMultiplier =
        1
        +
        level *
        growth;


    const baseProfit =
        round.bet
        *
        (
            rawMultiplier -
            1
        );


    const boostedProfit =
        baseProfit
        *
        getMoneyMultiplier();


    const payout =
        roundMoney(

            round.bet
            +
            boostedProfit

        );


    const profit =
        roundMoney(
            payout -
            round.bet
        );


    return {

        multiplier:
            roundMoney(
                payout /
                round.bet
            ),

        payout:
            payout,

        profit:
            profit,

        eventMultiplier:
            getMoneyMultiplier()

    };

}


// =====================================================
// =====================================================
// TOWER PAGE
// =====================================================
// =====================================================

app.get(
    "/game/tower",
    (
        req,
        res
    ) => {

        return v7GamePage(

            req,

            res,

            "Tower",

            "Wybierz bezpieczne pole na każdym poziomie i wypłać zanim trafisz bombę.",

            "tower",

            `

<div class="v7-game-controls">


    <div class="v7-control">

        <small>
            STAWKA
        </small>

        <input
            id="towerBet"
            type="number"
            min="1"
            step="1"
            value="10"
        >

    </div>


    <div class="v7-control">

        <small>
            BOMBY NA POZIOM
        </small>

        <select id="towerBombs">

            <option
                value="1"
                selected
            >
                1 bomba
            </option>

            <option value="2">
                2 bomby
            </option>

        </select>

    </div>


    <button
        id="towerStart"
        class="v7-game-button"
    >
        START
    </button>


    <button
        id="towerCashout"
        class="v7-game-button"
        disabled
    >
        WYPŁAĆ
    </button>


</div>


<div class="v7-stat-grid">


    <div class="v7-stat">

        <small>
            STAWKA
        </small>

        <strong id="towerStatBet">
            0,00 zł
        </strong>

    </div>


    <div class="v7-stat">

        <small>
            POZIOM
        </small>

        <strong
            id="towerStatLevel"
            class="v7-cyan"
        >
            0 / 8
        </strong>

    </div>


    <div class="v7-stat">

        <small>
            MNOŻNIK
        </small>

        <strong
            id="towerStatMultiplier"
            class="v7-cyan"
        >
            x1.00
        </strong>

    </div>


    <div class="v7-stat">

        <small>
            AKTUALNY ZYSK
        </small>

        <strong
            id="towerStatProfit"
            class="v7-green"
        >
            +0,00 zł
        </strong>

    </div>


    <div class="v7-stat">

        <small>
            DO WYPŁATY
        </small>

        <strong
            id="towerStatPayout"
            class="v7-green"
        >
            0,00 zł
        </strong>

    </div>


</div>


<div
    class="v7-tower-board"
    id="towerBoard"
>
</div>


<div class="v7-info-bar">


    <span id="towerInfo">

        Kliknij START,
        a potem wybierz pole na poziomie 1.

    </span>


    ${
        isLuckActive()

            ?

            `

<div class="v7-luck">

    🍀 LUCK ACTIVE

    • x${getLuckBoost().toFixed(2)}

</div>

`

            :

            `

<span>
    🍀 LUCK: OFF
</span>

`

    }


</div>

`,

            `

// =====================================================
// =====================================================
// TOWER FRONTEND
// =====================================================
// =====================================================

let towerRoundToken =
    null;


let towerActive =
    false;


let towerBetValue =
    0;


let towerLevel =
    0;


let towerMultiplierValue =
    1;


let towerPayoutValue =
    0;


let towerProfitValue =
    0;


const towerBoard =
    document.getElementById(
        "towerBoard"
    );


const towerStart =
    document.getElementById(
        "towerStart"
    );


const towerCashout =
    document.getElementById(
        "towerCashout"
    );


const towerBetInput =
    document.getElementById(
        "towerBet"
    );


const towerBombsInput =
    document.getElementById(
        "towerBombs"
    );


// =====================================================
// BUILD
// =====================================================

function buildTower(){

    towerBoard.innerHTML =
        "";


    for(
        let level = 0;
        level < 8;
        level++
    ){

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "v7-tower-row";


        row.dataset.level =
            level;


        const levelBox =
            document.createElement(
                "div"
            );


        levelBox.className =
            "v7-level";


        levelBox.textContent =
            "LV."
            +
            (
                level +
                1
            );


        row.appendChild(
            levelBox
        );


        for(
            let cell = 0;
            cell < 3;
            cell++
        ){

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "v7-tower-cell";


            button.textContent =
                "◆";


            button.disabled =
                true;


            button.dataset.cell =
                cell;


            button.addEventListener(
                "click",
                () => {

                    towerChoose(
                        level,
                        cell,
                        button
                    );

                }
            );


            row.appendChild(
                button
            );

        }


        towerBoard.appendChild(
            row
        );

    }

}


// =====================================================
// ACTIVATE LEVEL
// =====================================================

function activateTowerLevel(
    level
){

    document
        .querySelectorAll(
            ".v7-tower-row"
        )
        .forEach(
            row => {

                const rowLevel =
                    Number(
                        row.dataset.level
                    );


                row.classList.toggle(

                    "active",

                    towerActive
                    &&
                    rowLevel ===
                    level

                );


                if(
                    rowLevel <
                    level
                ){

                    row.classList.add(
                        "done"
                    );

                }


                row
                    .querySelectorAll(
                        ".v7-tower-cell"
                    )
                    .forEach(
                        button => {

                            button.disabled =

                                !towerActive

                                ||

                                rowLevel !==
                                level;

                        }
                    );

            }
        );

}


// =====================================================
// STATS
// =====================================================

function updateTowerStats(){

    document
        .getElementById(
            "towerStatBet"
        )
        .textContent =
        money(
            towerBetValue
        );


    document
        .getElementById(
            "towerStatLevel"
        )
        .textContent =
        towerLevel
        +
        " / 8";


    document
        .getElementById(
            "towerStatMultiplier"
        )
        .textContent =
        "x"
        +
        Number(
            towerMultiplierValue
        )
        .toFixed(
            2
        );


    const profitElement =
        document.getElementById(
            "towerStatProfit"
        );


    profitElement.textContent =

        (
            towerProfitValue >=
            0
                ?
                "+"
                :
                ""
        )

        +

        money(
            towerProfitValue
        );


    profitElement.className =

        towerProfitValue >
        0

            ?

            "v7-green"

            :

            towerProfitValue <
            0

                ?

                "v7-red"

                :

                "v7-cyan";


    document
        .getElementById(
            "towerStatPayout"
        )
        .textContent =
        money(
            towerPayoutValue
        );

}


// =====================================================
// START
// =====================================================

towerStart.addEventListener(
    "click",
    async () => {

        if(
            towerActive
        ){

            return;

        }


        towerStart.disabled =
            true;


        const result =
            await api(
                "/api/tower/start",
                {

                    method:
                        "POST",

                    body:
                        JSON.stringify({

                            bet:
                                Number(
                                    towerBetInput.value
                                ),

                            bombs:
                                Number(
                                    towerBombsInput.value
                                )

                        })

                }
            );


        const data =
            result.data;


        if(
            !data.ok
        ){

            towerStart.disabled =
                false;


            showNotification(

                "error",

                "Tower",

                data.message ||
                "Nie udało się rozpocząć."

            );


            return;

        }


        towerRoundToken =
            data.token;


        towerActive =
            true;


        towerBetValue =
            data.bet;


        towerLevel =
            0;


        towerMultiplierValue =
            1;


        towerPayoutValue =
            0;


        towerProfitValue =
            0;


        towerBetInput.disabled =
            true;


        towerBombsInput.disabled =
            true;


        towerCashout.disabled =
            true;


        updateBalance(
            data.saldo
        );


        buildTower();


        activateTowerLevel(
            0
        );


        updateTowerStats();


        document
            .getElementById(
                "towerInfo"
            )
            .textContent =
            "Wybierz jedno z trzech pól na poziomie 1.";


        showNotification(

            "success",

            "Tower rozpoczęty",

            "Stawka "
            +
            money(
                data.bet
            )
            +
            " została pobrana."

        );


        setTimeout(
            refreshBalance,
            200
        );

    }
);


// =====================================================
// CHOOSE
// =====================================================

async function towerChoose(
    level,
    cell,
    button
){

    if(
        !towerActive
        ||
        level !==
        towerLevel
    ){

        return;

    }


    const row =
        button.closest(
            ".v7-tower-row"
        );


    row
        .querySelectorAll(
            ".v7-tower-cell"
        )
        .forEach(
            item => {

                item.disabled =
                    true;

            }
        );


    const result =
        await api(
            "/api/tower/choose",
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        token:
                            towerRoundToken,

                        level:
                            level,

                        cell:
                            cell

                    })

            }
        );


    const data =
        result.data;


    if(
        !data.ok
    ){

        activateTowerLevel(
            towerLevel
        );


        showNotification(

            "error",

            "Tower",

            data.message ||
            "Nie udało się wybrać pola."

        );


        return;

    }


    // =================================================
    // BOMB
    // =================================================

    if(
        data.bomb ===
        true
    ){

        towerActive =
            false;


        towerCashout.disabled =
            true;


        towerStart.disabled =
            false;


        towerBetInput.disabled =
            false;


        towerBombsInput.disabled =
            false;


        const cells =
            Array.from(
                row.querySelectorAll(
                    ".v7-tower-cell"
                )
            );


        cells.forEach(
            (
                element,
                index
            ) => {

                element.disabled =
                    true;


                if(
                    data.bombs.includes(
                        index
                    )
                ){

                    element.textContent =
                        "💣";


                    element.classList.add(
                        "bomb"
                    );

                }

                else{

                    element.textContent =
                        "💎";


                    element.classList.add(
                        "safe"
                    );

                }

            }
        );


        button.textContent =
            "💥";


        towerPayoutValue =
            0;


        towerProfitValue =
            -towerBetValue;


        updateTowerStats();


        updateBalance(
            data.saldo
        );


        document
            .getElementById(
                "towerInfo"
            )
            .textContent =
            "Trafiłeś bombę.";


        showNotification(

            "loss",

            "Tower przegrany",

            "Straciłeś "
            +
            money(
                towerBetValue
            )
            +
            "."

        );


        setTimeout(
            refreshBalance,
            200
        );


        return;

    }


    // =================================================
    // SAFE / LUCK
    // =================================================

    if(
        data.luckSaved ===
        true
    ){

        button.textContent =
            "🍀";


        button.classList.add(
            "luck-save"
        );


        showNotification(

            "reward",

            "LUCK uratował!",

            "To pole było bombą."

        );

    }

    else{

        button.textContent =
            "💎";


        button.classList.add(
            "safe"
        );

    }


    towerLevel =
        Number(
            data.level
        );


    towerMultiplierValue =
        Number(
            data.multiplier || 1
        );


    towerPayoutValue =
        Number(
            data.payout || 0
        );


    towerProfitValue =
        Number(
            data.profit || 0
        );


    updateTowerStats();


    // =================================================
    // COMPLETE
    // =================================================

    if(
        data.completed ===
        true
    ){

        towerActive =
            false;


        towerStart.disabled =
            false;


        towerCashout.disabled =
            true;


        towerBetInput.disabled =
            false;


        towerBombsInput.disabled =
            false;


        updateBalance(
            data.saldo
        );


        document
            .querySelectorAll(
                ".v7-tower-cell"
            )
            .forEach(
                item => {

                    item.disabled =
                        true;

                }
            );


        document
            .getElementById(
                "towerInfo"
            )
            .textContent =
            "Tower ukończony!";


        showNotification(

            "win",

            "Tower ukończony!",

            "Wypłacono "
            +
            money(
                data.payout
            )
            +
            " • zysk +"
            +
            money(
                data.profit
            )

        );


        setTimeout(
            refreshBalance,
            200
        );


        return;

    }


    towerCashout.disabled =
        false;


    activateTowerLevel(
        towerLevel
    );


    document
        .getElementById(
            "towerInfo"
        )
        .textContent =

        "Poziom "
        +
        (
            towerLevel +
            1
        )
        +
        " • aktualny zysk "
        +
        (
            towerProfitValue >=
            0
                ?
                "+"
                :
                ""
        )
        +
        money(
            towerProfitValue
        );

}


// =====================================================
// CASHOUT
// =====================================================

towerCashout.addEventListener(
    "click",
    async () => {

        if(
            !towerActive
        ){

            return;

        }


        towerCashout.disabled =
            true;


        const result =
            await api(
                "/api/tower/cashout",
                {

                    method:
                        "POST",

                    body:
                        JSON.stringify({

                            token:
                                towerRoundToken

                        })

                }
            );


        const data =
            result.data;


        if(
            !data.ok
        ){

            towerCashout.disabled =
                false;


            showNotification(

                "error",

                "Tower",

                data.message ||
                "Nie udało się wypłacić."

            );


            return;

        }


        towerActive =
            false;


        towerStart.disabled =
            false;


        towerBetInput.disabled =
            false;


        towerBombsInput.disabled =
            false;


        towerMultiplierValue =
            Number(
                data.multiplier || 1
            );


        towerPayoutValue =
            Number(
                data.payout || 0
            );


        towerProfitValue =
            Number(
                data.profit || 0
            );


        updateTowerStats();


        document
            .querySelectorAll(
                ".v7-tower-cell"
            )
            .forEach(
                item => {

                    item.disabled =
                        true;

                }
            );


        // =============================================
        // SALDO LIVE
        // =============================================

        updateBalance(
            data.saldo
        );


        document
            .getElementById(
                "towerInfo"
            )
            .textContent =

            "Wypłacono "
            +
            money(
                data.payout
            );


        showNotification(

            "win",

            "Tower — wypłata",

            money(
                data.payout
            )
            +
            " • zysk "
            +
            (
                data.profit >=
                0
                    ?
                    "+"
                    :
                    ""
            )
            +
            money(
                data.profit
            )

        );


        setTimeout(
            refreshBalance,
            200
        );

    }
);


// =====================================================
// INITIAL
// =====================================================

buildTower();


updateTowerStats();

`

        );

    }
);


// =====================================================
// =====================================================
// TOWER START API
// =====================================================
// =====================================================

app.post(
    "/api/tower/start",
    (
        req,
        res
    ) => {

        if(
            !requireGameAvailable(
                req,
                res,
                "tower"
            )
        ){

            return;

        }


        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user,
            login

        } =
            account;


        const settings =
            loadSettings();


        if(
            settings.economyEnabled !==
            true
        ){

            return res.status(
                503
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Ekonomia jest wyłączona."

            });

        }


        const validation =
            validateBet(
                user,
                req.body?.bet
            );


        if(
            !validation.ok
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    validation.message

            });

        }


        const bombs =
            Number(
                req.body?.bombs
            );


        if(
            bombs !==
            1
            &&
            bombs !==
            2
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Wybierz 1 albo 2 bomby."

            });

        }


        for(
            const round
            of towerRounds.values()
        ){

            if(
                round.login ===
                login
            ){

                return res.status(
                    409
                )
                .json({

                    ok:false,

                    saldo:
                        user.saldo,

                    message:
                        "Masz już aktywną rundę Tower."

                });

            }

        }


        const bet =
            validation.bet;


        user.saldo =
            roundMoney(
                user.saldo -
                bet
            );


        const token =
            crypto
                .randomBytes(
                    24
                )
                .toString(
                    "hex"
                );


        towerRounds.set(

            token,

            {

                token:
                    token,

                login:
                    login,

                bet:
                    bet,

                bombsPerRow:
                    bombs,

                rows:
                    generateTowerRows(
                        bombs
                    ),

                level:
                    0,

                createdAt:
                    Date.now()

            }

        );


        saveUsers(
            users
        );


        return res.json({

            ok:true,

            token:
                token,

            bet:
                bet,

            bombs:
                bombs,

            saldo:
                user.saldo,

            luck:
                isLuckActive(),

            eventMultiplier:
                getMoneyMultiplier()

        });

    }
);


// =====================================================
// =====================================================
// TOWER CHOOSE
// =====================================================
// =====================================================

app.post(
    "/api/tower/choose",
    (
        req,
        res
    ) => {

        if(
            !requireGameAvailable(
                req,
                res,
                "tower"
            )
        ){

            return;

        }


        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user,
            login

        } =
            account;


        const token =
            String(
                req.body?.token || ""
            );


        const level =
            Number(
                req.body?.level
            );


        const cell =
            Number(
                req.body?.cell
            );


        const round =
            towerRounds.get(
                token
            );


        if(
            !round
            ||
            round.login !==
            login
        ){

            return res.status(
                404
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Runda Tower nie istnieje."

            });

        }


        if(
            level !==
            round.level
        ){

            return res.status(
                409
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "To nie jest aktualny poziom."

            });

        }


        if(
            !Number.isInteger(
                cell
            )
            ||
            cell <
            0
            ||
            cell >
            2
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Nieprawidłowe pole."

            });

        }


        const row =
            round.rows[
                round.level
            ];


        // =================================================
        // BOMB
        // =================================================

        if(
            row.has(
                cell
            )
        ){

            if(
                luckSavedFromBomb()
            ){

                relocateTowerBomb(

                    round,

                    round.level,

                    cell

                );


                round.level +=
                    1;


                const payoutData =
                    towerPayoutData(
                        round
                    );


                if(
                    round.level >=
                    TOWER_LEVELS
                ){

                    user.saldo =
                        roundMoney(

                            user.saldo
                            +
                            payoutData.payout

                        );


                    recordGame(
                        user,
                        payoutData.profit,
                        "tower"
                    );


                    towerRounds.delete(
                        token
                    );


                    saveUsers(
                        users
                    );


                    return res.json({

                        ok:true,

                        bomb:false,

                        luckSaved:true,

                        completed:true,

                        level:
                            round.level,

                        multiplier:
                            payoutData.multiplier,

                        payout:
                            payoutData.payout,

                        profit:
                            payoutData.profit,

                        eventMultiplier:
                            payoutData.eventMultiplier,

                        saldo:
                            user.saldo

                    });

                }


                return res.json({

                    ok:true,

                    bomb:false,

                    luckSaved:true,

                    completed:false,

                    level:
                        round.level,

                    multiplier:
                        payoutData.multiplier,

                    payout:
                        payoutData.payout,

                    profit:
                        payoutData.profit,

                    eventMultiplier:
                        payoutData.eventMultiplier,

                    saldo:
                        user.saldo

                });

            }


            // =================================================
            // LOSS
            // =================================================

            const bombs =
                Array.from(
                    row
                );


            recordGame(
                user,
                -round.bet,
                "tower"
            );


            towerRounds.delete(
                token
            );


            saveUsers(
                users
            );


            return res.json({

                ok:true,

                bomb:true,

                bombs:
                    bombs,

                level:
                    round.level,

                payout:
                    0,

                profit:
                    -round.bet,

                saldo:
                    user.saldo

            });

        }


        // =================================================
        // SAFE
        // =================================================

        round.level +=
            1;


        const payoutData =
            towerPayoutData(
                round
            );


        if(
            round.level >=
            TOWER_LEVELS
        ){

            user.saldo =
                roundMoney(

                    user.saldo
                    +
                    payoutData.payout

                );


            recordGame(
                user,
                payoutData.profit,
                "tower"
            );


            towerRounds.delete(
                token
            );


            saveUsers(
                users
            );


            return res.json({

                ok:true,

                bomb:false,

                luckSaved:false,

                completed:true,

                level:
                    round.level,

                multiplier:
                    payoutData.multiplier,

                payout:
                    payoutData.payout,

                profit:
                    payoutData.profit,

                eventMultiplier:
                    payoutData.eventMultiplier,

                saldo:
                    user.saldo

            });

        }


        return res.json({

            ok:true,

            bomb:false,

            luckSaved:false,

            completed:false,

            level:
                round.level,

            multiplier:
                payoutData.multiplier,

            payout:
                payoutData.payout,

            profit:
                payoutData.profit,

            eventMultiplier:
                payoutData.eventMultiplier,

            saldo:
                user.saldo

        });

    }
);


// =====================================================
// =====================================================
// TOWER CASHOUT
// =====================================================
// =====================================================

app.post(
    "/api/tower/cashout",
    (
        req,
        res
    ) => {

        if(
            !requireGameAvailable(
                req,
                res,
                "tower"
            )
        ){

            return;

        }


        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user,
            login

        } =
            account;


        const token =
            String(
                req.body?.token || ""
            );


        const round =
            towerRounds.get(
                token
            );


        if(
            !round
            ||
            round.login !==
            login
        ){

            return res.status(
                404
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Ta runda już nie istnieje."

            });

        }


        if(
            round.level <
            1
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Najpierw przejdź przynajmniej jeden poziom."

            });

        }


        const data =
            towerPayoutData(
                round
            );


        user.saldo =
            roundMoney(

                user.saldo
                +
                data.payout

            );


        recordGame(
            user,
            data.profit,
            "tower"
        );


        towerRounds.delete(
            token
        );


        saveUsers(
            users
        );


        addLog(

            login,

            "tower_cashout",

            login,

            "Poziom "
            +
            round.level
            +
            " | wypłata "
            +
            formatMoney(
                data.payout
            )
            +
            " | zysk "
            +
            formatMoney(
                data.profit
            )

        );


        return res.json({

            ok:true,

            level:
                round.level,

            multiplier:
                data.multiplier,

            payout:
                data.payout,

            profit:
                data.profit,

            eventMultiplier:
                data.eventMultiplier,

            saldo:
                user.saldo

        });

    }
);


// =====================================================
// =====================================================
// KONIEC SERVER.JS V7 — 4/6
// =====================================================
//
// CZĘŚĆ 5/6:
//
// 🎫 ZDRAPKA
// 🎰 SLOTY
// 🎡 RULETKA
// 🔮 LUCKY ORB
// 🚀 CRASH EVENT
//
// CRASH:
//
// ✅ EVENT ONLY
// ✅ TIMER/MNOŻNIK LIVE
// ✅ CASHOUT
//
// ✅ PO WYPŁACIE:
//    POKAŻE PRZY JAKIM x
//    RAKIETA NAPRAWDĘ BY SIĘ ROZBIŁA
//
// np:
//
// WYPŁATA: x2.30
// CRASH BYŁBY: x7.84
//
// ✅ NIE POKAŻE crashAt PRZED WYPŁATĄ
//
// ✅ SALDO LIVE
//
// NIE DODAWAJ app.listen()
//
// =====================================================
// =====================================================
// =====================================================
//                  7BETS SERVER
//                 POPRAWIONY V7
// =====================================================
// =====================================================
//
// SERVER.JS — CZĘŚĆ 5/6
//
// 🎫 ZDRAPKA
// 🎰 SLOTY
// 🎡 RULETKA
// 🔮 LUCKY ORB
// 🚀 CRASH
//
// ✅ SALDO LIVE
// ✅ MONEY x2 / x3
// ✅ LUCK
// ✅ POWIADOMIENIA
// ✅ DŹWIĘKI
//
// CRASH:
//
// ✅ EVENT ONLY
// ✅ MNOŻNIK LIVE
// ✅ CASHOUT
//
// ✅ PO WYPŁACIE POKAZUJE:
//    PRZY JAKIM x RAKIETA
//    NAPRAWDĘ BY SIĘ ROZBIŁA
//
// ✅ crashAt NIE JEST WYSYŁANE
//    PRZED ZAKOŃCZENIEM RUNDY
//
// NIE DODAWAJ JESZCZE app.listen()
//
// =====================================================


// =====================================================
// =====================================================
// EXTRA CSS GIER
// =====================================================
// =====================================================

const V7_EXTRA_GAME_CSS = `

<style>

/* =====================================================
   SCRATCH
===================================================== */

.v7-scratch-layout{

    display:grid;

    grid-template-columns:
        .8fr 1.2fr;

    gap:14px;

}


.v7-scratch-options{

    padding:18px;

    border-radius:14px;

    border:
        1px solid
        rgba(255,255,255,.045);

    background:
        rgba(255,255,255,.02);

}


.v7-scratch-values{

    display:grid;

    grid-template-columns:
        repeat(
            2,
            1fr
        );

    gap:8px;

    margin-top:14px;

}


.v7-scratch-value{

    min-height:58px;

    color:#8ca7af;

    border:
        1px solid
        rgba(92,236,255,.10);

    background:
        rgba(92,236,255,.03);

}


.v7-scratch-value.active{

    color:#001116;

    border-color:
        var(--cyan);

    background:

        linear-gradient(
            135deg,
            #76f4ff,
            #00bde5
        );

}


.v7-scratch-card{

    min-height:340px;

    position:relative;

    overflow:hidden;

    display:flex;

    flex-direction:column;

    align-items:center;

    justify-content:center;

    text-align:center;

    padding:25px;

    border-radius:18px;

    border:
        1px solid
        rgba(92,236,255,.16);

    background:

        radial-gradient(
            circle at 50% 40%,
            rgba(92,236,255,.11),
            transparent 38%
        ),

        linear-gradient(
            145deg,
            #092530,
            #041016
        );

}


.v7-scratch-card::before{

    content:"7";

    position:absolute;

    font-size:300px;

    font-weight:1000;

    color:
        rgba(92,236,255,.025);

    transform:
        rotate(-12deg);

}


.v7-scratch-icon{

    position:relative;

    z-index:2;

    font-size:75px;

}


.v7-scratch-title{

    position:relative;

    z-index:2;

    margin-top:10px;

    font-size:30px;

    font-weight:1000;

}


.v7-scratch-result{

    position:relative;

    z-index:2;

    margin-top:5px;

    color:
        var(--cyan);

    font-size:
        clamp(
            40px,
            8vw,
            65px
        );

    font-weight:1000;

    letter-spacing:-3px;

}


/* =====================================================
   SLOT
===================================================== */

.v7-slot-machine{

    width:
        min(
            720px,
            100%
        );

    margin:auto;

}


.v7-slot-reels{

    display:grid;

    grid-template-columns:
        repeat(
            3,
            1fr
        );

    gap:10px;

    margin:
        25px 0;

}


.v7-slot-reel{

    min-height:180px;

    display:grid;

    place-items:center;

    position:relative;

    overflow:hidden;

    border-radius:17px;

    border:
        1px solid
        rgba(92,236,255,.13);

    background:

        linear-gradient(
            180deg,
            #02090d,
            #0a222d,
            #02090d
        );

    box-shadow:

        inset 0 0 35px
        rgba(0,0,0,.55);

}


.v7-slot-symbol{

    font-size:
        clamp(
            55px,
            10vw,
            90px
        );

}


.v7-slot-symbol.spinning{

    animation:
        v7SlotSpin
        .11s
        linear
        infinite;

}


@keyframes v7SlotSpin{

    0%{

        transform:
            translateY(-10px)
            scale(.94);

        opacity:.55;

    }

    50%{

        transform:
            translateY(10px)
            scale(1.05);

        opacity:1;

    }

    100%{

        transform:
            translateY(-10px)
            scale(.94);

        opacity:.55;

    }

}


/* =====================================================
   ROULETTE
===================================================== */

.v7-roulette-layout{

    display:grid;

    grid-template-columns:
        1fr 1fr;

    gap:18px;

}


.v7-wheel-wrap{

    display:grid;

    place-items:center;

    padding:20px;

}


.v7-wheel-arrow{

    width:0;

    height:0;

    margin:
        0 auto -18px;

    position:relative;

    z-index:4;

    border-left:
        15px solid transparent;

    border-right:
        15px solid transparent;

    border-top:
        29px solid var(--cyan);

}


.v7-wheel{

    width:
        min(
            340px,
            80vw
        );

    aspect-ratio:1;

    display:grid;

    place-items:center;

    border-radius:50%;

    border:
        10px solid
        #07141b;

    background:

        conic-gradient(

            #39d98a 0deg 24deg,

            #d74356 24deg 48deg,
            #151d22 48deg 72deg,

            #d74356 72deg 96deg,
            #151d22 96deg 120deg,

            #d74356 120deg 144deg,
            #151d22 144deg 168deg,

            #d74356 168deg 192deg,
            #151d22 192deg 216deg,

            #d74356 216deg 240deg,
            #151d22 240deg 264deg,

            #d74356 264deg 288deg,
            #151d22 288deg 312deg,

            #d74356 312deg 336deg,
            #151d22 336deg 360deg

        );

    box-shadow:

        0 25px 70px
        rgba(0,0,0,.35),

        inset 0 0 25px
        rgba(0,0,0,.5);

    transition:

        transform
        2.6s
        cubic-bezier(
            .08,
            .65,
            .12,
            1
        );

}


.v7-wheel::after{

    content:"7";

    width:115px;

    height:115px;

    display:grid;

    place-items:center;

    border-radius:50%;

    color:
        var(--cyan);

    font-size:50px;

    font-weight:1000;

    background:#041016;

    border:
        5px solid
        #092631;

}


.v7-roulette-options{

    display:grid;

    grid-template-columns:
        repeat(
            3,
            1fr
        );

    gap:8px;

    margin-top:13px;

}


.v7-roulette-choice{

    min-height:72px;

    color:#fff;

    border:
        1px solid
        rgba(255,255,255,.06);

}


.v7-roulette-choice.red{

    background:
        rgba(215,67,86,.16);

}


.v7-roulette-choice.black{

    background:
        rgba(10,14,17,.85);

}


.v7-roulette-choice.green{

    background:
        rgba(57,217,138,.13);

}


.v7-roulette-choice.selected{

    outline:
        2px solid
        var(--cyan);

}


/* =====================================================
   LUCKY
===================================================== */

.v7-lucky-wrap{

    min-height:440px;

    display:flex;

    flex-direction:column;

    align-items:center;

    justify-content:center;

}


.v7-orb{

    width:
        min(
            260px,
            65vw
        );

    aspect-ratio:1;

    display:grid;

    place-items:center;

    position:relative;

    border-radius:50%;

    border:
        1px solid
        rgba(92,236,255,.30);

    background:

        radial-gradient(
            circle at 35% 30%,
            rgba(255,255,255,.65),
            rgba(92,236,255,.24) 10%,
            rgba(21,72,95,.45) 32%,
            #06141d 65%,
            #020609
        );

    box-shadow:

        0 0 80px
        rgba(92,236,255,.10),

        inset 0 0 60px
        rgba(92,236,255,.08);

}


.v7-orb::before{

    content:"";

    position:absolute;

    inset:-23px;

    border-radius:50%;

    border:
        1px solid
        rgba(92,236,255,.07);

    animation:
        v7OrbRing
        4s
        linear
        infinite;

}


@keyframes v7OrbRing{

    from{

        transform:
            rotate(0deg)
            scale(.95);

    }

    50%{

        transform:
            rotate(180deg)
            scale(1.04);

    }

    to{

        transform:
            rotate(360deg)
            scale(.95);

    }

}


.v7-orb.spinning{

    animation:
        v7OrbSpin
        .13s
        linear
        infinite;

}


@keyframes v7OrbSpin{

    0%{

        transform:
            scale(.97)
            rotate(-3deg);

    }

    50%{

        transform:
            scale(1.04)
            rotate(3deg);

    }

    100%{

        transform:
            scale(.97)
            rotate(-3deg);

    }

}


.v7-orb-value{

    position:relative;

    z-index:3;

    font-size:
        clamp(
            38px,
            8vw,
            58px
        );

    font-weight:1000;

}


/* =====================================================
   CRASH
===================================================== */

.v7-crash-stage{

    min-height:480px;

    display:flex;

    flex-direction:column;

    position:relative;

    overflow:hidden;

    border-radius:16px;

    border:
        1px solid
        rgba(92,236,255,.08);

    background:

        linear-gradient(
            rgba(92,236,255,.025) 1px,
            transparent 1px
        ),

        linear-gradient(
            90deg,
            rgba(92,236,255,.025) 1px,
            transparent 1px
        ),

        radial-gradient(
            circle at 20% 80%,
            rgba(92,236,255,.07),
            transparent 30%
        ),

        #030b10;

    background-size:
        40px 40px,
        40px 40px,
        auto,
        auto;

}


.v7-crash-header{

    display:flex;

    align-items:center;

    justify-content:space-between;

    gap:15px;

    padding:20px;

}


.v7-crash-live{

    padding:
        7px 10px;

    border-radius:999px;

    color:
        var(--red);

    font-size:9px;

    font-weight:1000;

    border:
        1px solid
        rgba(255,104,123,.15);

    background:
        rgba(255,104,123,.05);

}


.v7-crash-area{

    flex:1;

    display:grid;

    place-items:center;

    position:relative;

}


.v7-crash-multiplier{

    position:relative;

    z-index:3;

    font-size:
        clamp(
            65px,
            13vw,
            125px
        );

    font-weight:1000;

    letter-spacing:-7px;

    color:#fff;

    text-shadow:

        0 0 45px
        rgba(92,236,255,.15);

}


.v7-crash-multiplier.crashed{

    color:
        var(--red);

}


.v7-crash-rocket{

    position:absolute;

    left:15%;

    bottom:12%;

    font-size:50px;

    transform:
        rotate(-40deg);

    transition:

        left .23s linear,
        bottom .23s linear;

}


.v7-crash-rocket.flying{

    animation:
        v7RocketPulse
        .55s
        ease-in-out
        infinite;

}


@keyframes v7RocketPulse{

    0%,
    100%{

        filter:
            drop-shadow(
                0 0 10px
                rgba(92,236,255,.15)
            );

    }

    50%{

        filter:
            drop-shadow(
                0 0 25px
                rgba(92,236,255,.48)
            );

    }

}


.v7-crash-stop{

    position:absolute;

    left:50%;

    bottom:15%;

    z-index:5;

    min-width:260px;

    padding:
        10px 15px;

    transform:
        translateX(-50%);

    text-align:center;

    border-radius:999px;

    opacity:0;

    color:#78949d;

    font-size:10px;

    font-weight:900;

    border:
        1px solid
        rgba(92,236,255,.11);

    background:
        rgba(2,9,13,.88);

    backdrop-filter:
        blur(12px);

    transition:.25s ease;

}


.v7-crash-stop.visible{

    opacity:1;

}


.v7-crash-stop strong{

    color:
        var(--cyan);

    font-size:16px;

}


.v7-crash-controls{

    display:grid;

    grid-template-columns:
        1fr auto auto;

    gap:9px;

    padding:20px;

    border-top:
        1px solid
        rgba(255,255,255,.04);

}


/* =====================================================
   MOBILE
===================================================== */

@media(max-width:800px){

    .v7-scratch-layout,
    .v7-roulette-layout{

        grid-template-columns:
            1fr;

    }


    .v7-crash-controls{

        grid-template-columns:
            1fr;

    }

}


@media(max-width:500px){

    .v7-slot-reel{

        min-height:125px;

    }


    .v7-roulette-options{

        grid-template-columns:
            1fr;

    }

}

</style>

`;


// =====================================================
// =====================================================
// ZDRAPKA
// =====================================================
// =====================================================

app.get(
    "/game/scratch",
    (
        req,
        res
    ) => {

        return v7GamePage(

            req,

            res,

            "Zdrapka",

            "Wybierz wartość zdrapki i sprawdź wynik.",

            "scratch",

            `

${V7_EXTRA_GAME_CSS}


<div class="v7-scratch-layout">


    <div class="v7-scratch-options">


        <div class="eyebrow">
            WYBIERZ ZDRAPKĘ
        </div>


        <h2>
            🎫 Stawka
        </h2>


        <div class="v7-scratch-values">


            <button
                class="v7-scratch-value active"
                data-scratch="5"
            >
                5 zł
            </button>


            <button
                class="v7-scratch-value"
                data-scratch="10"
            >
                10 zł
            </button>


            <button
                class="v7-scratch-value"
                data-scratch="50"
            >
                50 zł
            </button>


            <button
                class="v7-scratch-value"
                data-scratch="100"
            >
                100 zł
            </button>


        </div>


        <button
            id="scratchPlay"
            style="
                width:100%;
                margin-top:14px
            "
        >
            KUP ZDRAPKĘ
        </button>


    </div>


    <div class="v7-scratch-card">


        <div
            class="v7-scratch-icon"
            id="scratchIcon"
        >
            🎫
        </div>


        <div
            class="v7-scratch-title"
            id="scratchTitle"
        >
            GOTOWY?
        </div>


        <div
            class="v7-scratch-result"
            id="scratchResult"
        >
            ???
        </div>


        <div
            class="muted"
            id="scratchText"
        >
            Wybierz zdrapkę i kliknij.
        </div>


    </div>


</div>

`,

            `

let scratchBet =
    5;


let scratchBusy =
    false;


document
    .querySelectorAll(
        "[data-scratch]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if(
                        scratchBusy
                    ){

                        return;

                    }


                    document
                        .querySelectorAll(
                            "[data-scratch]"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    scratchBet =
                        Number(
                            button.dataset.scratch
                        );

                }
            );

        }
    );


document
    .getElementById(
        "scratchPlay"
    )
    .addEventListener(
        "click",
        async () => {

            if(
                scratchBusy
            ){

                return;

            }


            scratchBusy =
                true;


            const button =
                document.getElementById(
                    "scratchPlay"
                );


            button.disabled =
                true;


            document
                .getElementById(
                    "scratchTitle"
                )
                .textContent =
                "DRAPIEMY...";


            document
                .getElementById(
                    "scratchResult"
                )
                .textContent =
                "•••";


            const result =
                await api(
                    "/api/scratch/play",
                    {

                        method:"POST",

                        body:
                            JSON.stringify({

                                bet:
                                    scratchBet

                            })

                    }
                );


            const data =
                result.data;


            if(
                !data.ok
            ){

                scratchBusy =
                    false;


                button.disabled =
                    false;


                showNotification(

                    "error",

                    "Zdrapka",

                    data.message ||
                    "Nie udało się zagrać."

                );


                return;

            }


            updateBalance(
                data.saldo
            );


            let ticks =
                0;


            const animation =
                setInterval(
                    () => {

                        ticks++;


                        document
                            .getElementById(
                                "scratchResult"
                            )
                            .textContent =
                            "x"
                            +
                            (
                                Math.random() *
                                10
                            )
                            .toFixed(
                                2
                            );


                        playUiSound(
                            "click"
                        );


                        if(
                            ticks >=
                            9
                        ){

                            clearInterval(
                                animation
                            );


                            scratchBusy =
                                false;


                            button.disabled =
                                false;


                            document
                                .getElementById(
                                    "scratchResult"
                                )
                                .textContent =
                                money(
                                    data.payout
                                );


                            if(
                                data.payout >
                                0
                            ){

                                document
                                    .getElementById(
                                        "scratchIcon"
                                    )
                                    .textContent =
                                    "💰";


                                document
                                    .getElementById(
                                        "scratchTitle"
                                    )
                                    .textContent =
                                    "WYGRANA!";


                                document
                                    .getElementById(
                                        "scratchText"
                                    )
                                    .textContent =
                                    "Mnożnik x"
                                    +
                                    Number(
                                        data.multiplier
                                    )
                                    .toFixed(
                                        2
                                    );


                                showNotification(

                                    "win",

                                    "Zdrapka wygrana",

                                    "Wygrałeś "
                                    +
                                    money(
                                        data.payout
                                    )

                                );

                            }

                            else{

                                document
                                    .getElementById(
                                        "scratchIcon"
                                    )
                                    .textContent =
                                    "💥";


                                document
                                    .getElementById(
                                        "scratchTitle"
                                    )
                                    .textContent =
                                    "PUSTA";


                                document
                                    .getElementById(
                                        "scratchText"
                                    )
                                    .textContent =
                                    "Spróbuj ponownie.";


                                showNotification(

                                    "loss",

                                    "Brak wygranej",

                                    "Ta zdrapka była pusta."

                                );

                            }


                            setTimeout(
                                refreshBalance,
                                200
                            );

                        }

                    },
                    95
                );

        }
    );

`

        );

    }
);


// =====================================================
// ZDRAPKA API
// =====================================================

app.post(
    "/api/scratch/play",
    (
        req,
        res
    ) => {

        if(
            !requireGameAvailable(
                req,
                res,
                "scratch"
            )
        ){

            return;

        }


        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user

        } =
            account;


        const settings =
            loadSettings();


        if(
            settings.economyEnabled !==
            true
        ){

            return res.status(
                503
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Ekonomia jest wyłączona."

            });

        }


        const bet =
            Number(
                req.body?.bet
            );


        if(
            ![
                5,
                10,
                50,
                100
            ]
            .includes(
                bet
            )
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Nieprawidłowa zdrapka."

            });

        }


        if(
            user.saldo <
            bet
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Masz za mało pieniędzy."

            });

        }


        user.saldo =
            roundMoney(
                user.saldo -
                bet
            );


        let winChance =
            .34;


        if(
            isLuckActive()
        ){

            winChance =
                Math.min(

                    .75,

                    winChance *
                    getLuckBoost()

                );

        }


        let multiplier =
            0;


        if(
            Math.random() <
            winChance
        ){

            const roll =
                Math.random();


            if(
                roll <
                .42
            ){

                multiplier =
                    1.25;

            }

            else if(
                roll <
                .69
            ){

                multiplier =
                    1.75;

            }

            else if(
                roll <
                .84
            ){

                multiplier =
                    3;

            }

            else if(
                roll <
                .95
            ){

                multiplier =
                    6;

            }

            else{

                multiplier =
                    12;

            }


            multiplier *=
                getMoneyMultiplier();

        }


        multiplier =
            roundMoney(
                multiplier
            );


        const payout =
            roundMoney(
                bet *
                multiplier
            );


        user.saldo =
            roundMoney(
                user.saldo +
                payout
            );


        const profit =
            roundMoney(
                payout -
                bet
            );


        recordGame(
            user,
            profit,
            "zdrapki"
        );


        saveUsers(
            users
        );


        return res.json({

            ok:true,

            bet:
                bet,

            multiplier:
                multiplier,

            payout:
                payout,

            profit:
                profit,

            saldo:
                user.saldo

        });

    }
);


// =====================================================
// =====================================================
// SLOTY
// =====================================================
// =====================================================

const V7_SLOT_SYMBOLS = [

    "🍒",
    "🍋",
    "💎",
    "⭐",
    "7️⃣",
    "🔔"

];


app.get(
    "/game/slots",
    (
        req,
        res
    ) => {

        return v7GamePage(

            req,

            res,

            "Sloty",

            "Zakręć trzema bębnami i traf pasujące symbole.",

            "slots",

            `

${V7_EXTRA_GAME_CSS}


<div class="v7-slot-machine">


    <div class="v7-game-controls">


        <div
            class="v7-control"
            style="
                grid-column:span 2
            "
        >

            <small>
                STAWKA
            </small>

            <input
                id="slotsBet"
                type="number"
                min="1"
                value="10"
            >

        </div>


        <button id="slotsPlay">
            ZAKRĘĆ
        </button>


    </div>


    <div class="v7-slot-reels">


        <div class="v7-slot-reel">

            <div
                class="v7-slot-symbol"
                id="slot1"
            >
                7️⃣
            </div>

        </div>


        <div class="v7-slot-reel">

            <div
                class="v7-slot-symbol"
                id="slot2"
            >
                7️⃣
            </div>

        </div>


        <div class="v7-slot-reel">

            <div
                class="v7-slot-symbol"
                id="slot3"
            >
                7️⃣
            </div>

        </div>


    </div>


    <div class="v7-info-bar">

        <span>
            2 takie same = x2
        </span>

        <span>
            3 takie same = x6
        </span>

    </div>


</div>

`,

            `

let slotsBusy =
    false;


const slotElements = [

    document.getElementById(
        "slot1"
    ),

    document.getElementById(
        "slot2"
    ),

    document.getElementById(
        "slot3"
    )

];


document
    .getElementById(
        "slotsPlay"
    )
    .addEventListener(
        "click",
        async () => {

            if(
                slotsBusy
            ){

                return;

            }


            slotsBusy =
                true;


            const button =
                document.getElementById(
                    "slotsPlay"
                );


            button.disabled =
                true;


            slotElements.forEach(
                element =>
                    element.classList.add(
                        "spinning"
                    )
            );


            const fakeSymbols = [

                "🍒",
                "🍋",
                "💎",
                "⭐",
                "7️⃣",
                "🔔"

            ];


            const animation =
                setInterval(
                    () => {

                        slotElements.forEach(
                            element => {

                                element.textContent =

                                    fakeSymbols[
                                        Math.floor(
                                            Math.random() *
                                            fakeSymbols.length
                                        )
                                    ];

                            }
                        );


                        playUiSound(
                            "click"
                        );

                    },
                    85
                );


            const result =
                await api(
                    "/api/slots/play",
                    {

                        method:"POST",

                        body:
                            JSON.stringify({

                                bet:
                                    Number(
                                        document
                                            .getElementById(
                                                "slotsBet"
                                            )
                                            .value
                                    )

                            })

                    }
                );


            const data =
                result.data;


            setTimeout(
                () => {

                    clearInterval(
                        animation
                    );


                    slotElements.forEach(
                        (
                            element,
                            index
                        ) => {

                            element.classList.remove(
                                "spinning"
                            );


                            if(
                                data.ok
                            ){

                                element.textContent =
                                    data.symbols[
                                        index
                                    ];

                            }

                        }
                    );


                    slotsBusy =
                        false;


                    button.disabled =
                        false;


                    if(
                        !data.ok
                    ){

                        showNotification(

                            "error",

                            "Sloty",

                            data.message ||
                            "Nie udało się zagrać."

                        );


                        return;

                    }


                    updateBalance(
                        data.saldo
                    );


                    if(
                        data.payout >
                        0
                    ){

                        showNotification(

                            "win",

                            "Wygrana!",

                            "Wypłacono "
                            +
                            money(
                                data.payout
                            )

                        );

                    }

                    else{

                        showNotification(

                            "loss",

                            "Brak wygranej",

                            "Spróbuj ponownie."

                        );

                    }


                    setTimeout(
                        refreshBalance,
                        200
                    );

                },
                1300
            );

        }
    );

`

        );

    }
);


// =====================================================
// SLOT API
// =====================================================

app.post(
    "/api/slots/play",
    (
        req,
        res
    ) => {

        if(
            !requireGameAvailable(
                req,
                res,
                "slots"
            )
        ){

            return;

        }


        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user

        } =
            account;


        const validation =
            validateBet(
                user,
                req.body?.bet
            );


        if(
            !validation.ok
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    validation.message

            });

        }


        const bet =
            validation.bet;


        user.saldo =
            roundMoney(
                user.saldo -
                bet
            );


        let symbols = [

            randomItem(
                V7_SLOT_SYMBOLS
            ),

            randomItem(
                V7_SLOT_SYMBOLS
            ),

            randomItem(
                V7_SLOT_SYMBOLS
            )

        ];


        if(
            isLuckActive()
            &&
            Math.random() <
            Math.min(
                .45,
                .12 *
                getLuckBoost()
            )
        ){

            const symbol =
                randomItem(
                    V7_SLOT_SYMBOLS
                );


            if(
                Math.random() <
                .32
            ){

                symbols = [

                    symbol,
                    symbol,
                    symbol

                ];

            }

            else{

                const first =
                    randInt(
                        0,
                        2
                    );


                let second =
                    randInt(
                        0,
                        2
                    );


                while(
                    second ===
                    first
                ){

                    second =
                        randInt(
                            0,
                            2
                        );

                }


                symbols[
                    first
                ] =
                    symbol;


                symbols[
                    second
                ] =
                    symbol;

            }

        }


        const counts =
            {};


        for(
            const symbol
            of symbols
        ){

            counts[
                symbol
            ] =
                (
                    counts[
                        symbol
                    ] || 0
                )
                +
                1;

        }


        const best =
            Math.max(
                ...Object.values(
                    counts
                )
            );


        let multiplier =
            0;


        if(
            best ===
            3
        ){

            multiplier =
                6;

        }

        else if(
            best ===
            2
        ){

            multiplier =
                2;

        }


        if(
            multiplier >
            0
        ){

            multiplier *=
                getMoneyMultiplier();

        }


        const payout =
            roundMoney(
                bet *
                multiplier
            );


        user.saldo =
            roundMoney(
                user.saldo +
                payout
            );


        const profit =
            roundMoney(
                payout -
                bet
            );


        recordGame(
            user,
            profit,
            "sloty"
        );


        saveUsers(
            users
        );


        return res.json({

            ok:true,

            symbols:
                symbols,

            bet:
                bet,

            multiplier:
                multiplier,

            payout:
                payout,

            profit:
                profit,

            saldo:
                user.saldo

        });

    }
);


// =====================================================
// =====================================================
// RULETKA
// =====================================================
// =====================================================

const V7_ROULETTE = [

    {
        number:0,
        color:"green"
    },

    {
        number:1,
        color:"red"
    },

    {
        number:2,
        color:"black"
    },

    {
        number:3,
        color:"red"
    },

    {
        number:4,
        color:"black"
    },

    {
        number:5,
        color:"red"
    },

    {
        number:6,
        color:"black"
    },

    {
        number:7,
        color:"red"
    },

    {
        number:8,
        color:"black"
    },

    {
        number:9,
        color:"red"
    },

    {
        number:10,
        color:"black"
    },

    {
        number:11,
        color:"red"
    },

    {
        number:12,
        color:"black"
    },

    {
        number:13,
        color:"red"
    },

    {
        number:14,
        color:"black"
    }

];


app.get(
    "/game/roulette",
    (
        req,
        res
    ) => {

        return v7GamePage(

            req,

            res,

            "Ruletka",

            "Wybierz kolor i zakręć kołem.",

            "roulette",

            `

${V7_EXTRA_GAME_CSS}


<div class="v7-roulette-layout">


    <div class="v7-wheel-wrap">


        <div class="v7-wheel-arrow"></div>


        <div
            class="v7-wheel"
            id="rouletteWheel"
        ></div>


    </div>


    <div>


        <div class="v7-control">

            <small>
                STAWKA
            </small>

            <input
                id="rouletteBet"
                type="number"
                min="1"
                value="10"
            >

        </div>


        <div class="v7-roulette-options">


            <button
                class="v7-roulette-choice red selected"
                data-roulette="red"
            >
                🔴
                <br>
                CZERWONY
                <br>
                x2
            </button>


            <button
                class="v7-roulette-choice black"
                data-roulette="black"
            >
                ⚫
                <br>
                CZARNY
                <br>
                x2
            </button>


            <button
                class="v7-roulette-choice green"
                data-roulette="green"
            >
                🟢
                <br>
                ZIELONY
                <br>
                x14
            </button>


        </div>


        <button
            id="roulettePlay"
            style="
                width:100%;
                margin-top:12px
            "
        >
            ZAKRĘĆ
        </button>


        <div
            class="v7-info-bar"
            style="
                margin-top:15px
            "
        >

            <span>
                Ostatni wynik
            </span>

            <strong id="rouletteResult">
                —
            </strong>

        </div>


    </div>


</div>

`,

            `

let rouletteColor =
    "red";


let rouletteBusy =
    false;


let rouletteRotation =
    0;


document
    .querySelectorAll(
        "[data-roulette]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if(
                        rouletteBusy
                    ){

                        return;

                    }


                    document
                        .querySelectorAll(
                            "[data-roulette]"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "selected"
                                )
                        );


                    button.classList.add(
                        "selected"
                    );


                    rouletteColor =
                        button.dataset.roulette;

                }
            );

        }
    );


document
    .getElementById(
        "roulettePlay"
    )
    .addEventListener(
        "click",
        async () => {

            if(
                rouletteBusy
            ){

                return;

            }


            rouletteBusy =
                true;


            const button =
                document.getElementById(
                    "roulettePlay"
                );


            button.disabled =
                true;


            const result =
                await api(
                    "/api/roulette/play",
                    {

                        method:"POST",

                        body:
                            JSON.stringify({

                                bet:
                                    Number(
                                        document
                                            .getElementById(
                                                "rouletteBet"
                                            )
                                            .value
                                    ),

                                color:
                                    rouletteColor

                            })

                    }
                );


            const data =
                result.data;


            if(
                !data.ok
            ){

                rouletteBusy =
                    false;


                button.disabled =
                    false;


                showNotification(

                    "error",

                    "Ruletka",

                    data.message ||
                    "Nie udało się zagrać."

                );


                return;

            }


            rouletteRotation +=

                1440
                +
                Math.floor(
                    Math.random() *
                    300
                )
                +
                120;


            document
                .getElementById(
                    "rouletteWheel"
                )
                .style
                .transform =
                "rotate("
                +
                rouletteRotation
                +
                "deg)";


            setTimeout(
                () => {

                    rouletteBusy =
                        false;


                    button.disabled =
                        false;


                    updateBalance(
                        data.saldo
                    );


                    document
                        .getElementById(
                            "rouletteResult"
                        )
                        .textContent =

                        data.number
                        +
                        " • "
                        +
                        data.color
                            .toUpperCase();


                    if(
                        data.win
                    ){

                        showNotification(

                            "win",

                            "Ruletka wygrana",

                            "Wypłacono "
                            +
                            money(
                                data.payout
                            )

                        );

                    }

                    else{

                        showNotification(

                            "loss",

                            "Ruletka przegrana",

                            "Wypadło "
                            +
                            data.color
                            +
                            "."

                        );

                    }


                    setTimeout(
                        refreshBalance,
                        200
                    );

                },
                2700
            );

        }
    );

`

        );

    }
);


// =====================================================
// RULETKA API
// =====================================================

app.post(
    "/api/roulette/play",
    (
        req,
        res
    ) => {

        if(
            !requireGameAvailable(
                req,
                res,
                "roulette"
            )
        ){

            return;

        }


        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user

        } =
            account;


        const validation =
            validateBet(
                user,
                req.body?.bet
            );


        if(
            !validation.ok
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    validation.message

            });

        }


        const color =
            String(
                req.body?.color || ""
            )
            .toLowerCase();


        if(
            ![
                "red",
                "black",
                "green"
            ]
            .includes(
                color
            )
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    "Nieprawidłowy kolor."

            });

        }


        const bet =
            validation.bet;


        user.saldo =
            roundMoney(
                user.saldo -
                bet
            );


        let result =
            randomItem(
                V7_ROULETTE
            );


        if(
            isLuckActive()
            &&
            Math.random() <
            Math.min(
                .30,
                .09 *
                getLuckBoost()
            )
        ){

            const matching =
                V7_ROULETTE.filter(
                    item =>
                        item.color ===
                        color
                );


            result =
                randomItem(
                    matching
                )
                ||
                result;

        }


        const win =
            result.color ===
            color;


        let multiplier =
            0;


        if(
            win
        ){

            multiplier =
                color ===
                "green"
                    ?
                    14
                    :
                    2;


            multiplier *=
                getMoneyMultiplier();

        }


        const payout =
            roundMoney(
                bet *
                multiplier
            );


        user.saldo =
            roundMoney(
                user.saldo +
                payout
            );


        const profit =
            roundMoney(
                payout -
                bet
            );


        recordGame(
            user,
            profit,
            "ruletka"
        );


        saveUsers(
            users
        );


        return res.json({

            ok:true,

            number:
                result.number,

            color:
                result.color,

            selected:
                color,

            win:
                win,

            multiplier:
                multiplier,

            payout:
                payout,

            profit:
                profit,

            saldo:
                user.saldo

        });

    }
);


// =====================================================
// =====================================================
// LUCKY ORB
// =====================================================
// =====================================================

app.get(
    "/game/lucky",
    (
        req,
        res
    ) => {

        return v7GamePage(

            req,

            res,

            "Lucky Orb",

            "Uruchom kulę i wylosuj mnożnik.",

            "lucky",

            `

${V7_EXTRA_GAME_CSS}


<div class="v7-lucky-wrap">


    <div
        class="v7-orb"
        id="luckyOrb"
    >

        <div
            class="v7-orb-value"
            id="luckyValue"
        >
            x?
        </div>

    </div>


    <div
        class="v7-game-controls"
        style="
            width:min(560px,100%);
            margin-top:50px;
            grid-template-columns:1fr auto
        "
    >


        <div class="v7-control">

            <small>
                STAWKA
            </small>

            <input
                id="luckyBet"
                type="number"
                min="1"
                value="10"
            >

        </div>


        <button id="luckyPlay">
            URUCHOM
        </button>


    </div>


</div>

`,

            `

let luckyBusy =
    false;


document
    .getElementById(
        "luckyPlay"
    )
    .addEventListener(
        "click",
        async () => {

            if(
                luckyBusy
            ){

                return;

            }


            luckyBusy =
                true;


            const button =
                document.getElementById(
                    "luckyPlay"
                );


            const orb =
                document.getElementById(
                    "luckyOrb"
                );


            const value =
                document.getElementById(
                    "luckyValue"
                );


            button.disabled =
                true;


            orb.classList.add(
                "spinning"
            );


            const animation =
                setInterval(
                    () => {

                        value.textContent =
                            "x"
                            +
                            (
                                Math.random() *
                                10
                            )
                            .toFixed(
                                2
                            );


                        playUiSound(
                            "click"
                        );

                    },
                    95
                );


            const result =
                await api(
                    "/api/lucky/play",
                    {

                        method:"POST",

                        body:
                            JSON.stringify({

                                bet:
                                    Number(
                                        document
                                            .getElementById(
                                                "luckyBet"
                                            )
                                            .value
                                    )

                            })

                    }
                );


            const data =
                result.data;


            setTimeout(
                () => {

                    clearInterval(
                        animation
                    );


                    orb.classList.remove(
                        "spinning"
                    );


                    luckyBusy =
                        false;


                    button.disabled =
                        false;


                    if(
                        !data.ok
                    ){

                        value.textContent =
                            "x?";


                        showNotification(

                            "error",

                            "Lucky Orb",

                            data.message ||
                            "Nie udało się zagrać."

                        );


                        return;

                    }


                    value.textContent =
                        "x"
                        +
                        Number(
                            data.multiplier
                        )
                        .toFixed(
                            2
                        );


                    updateBalance(
                        data.saldo
                    );


                    if(
                        data.payout >
                        0
                    ){

                        showNotification(

                            "win",

                            "Lucky Orb",

                            "Wypłacono "
                            +
                            money(
                                data.payout
                            )

                        );

                    }

                    else{

                        showNotification(

                            "loss",

                            "Lucky Orb",

                            "Tym razem x0."

                        );

                    }


                    setTimeout(
                        refreshBalance,
                        200
                    );

                },
                1700
            );

        }
    );

`

        );

    }
);


// =====================================================
// LUCKY API
// =====================================================

app.post(
    "/api/lucky/play",
    (
        req,
        res
    ) => {

        if(
            !requireGameAvailable(
                req,
                res,
                "lucky"
            )
        ){

            return;

        }


        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user

        } =
            account;


        const validation =
            validateBet(
                user,
                req.body?.bet
            );


        if(
            !validation.ok
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    validation.message

            });

        }


        const bet =
            validation.bet;


        user.saldo =
            roundMoney(
                user.saldo -
                bet
            );


        const roll =
            Math.random();


        let multiplier =
            0;


        if(
            isLuckActive()
        ){

            if(
                roll <
                .16
            ){

                multiplier =
                    0;

            }

            else if(
                roll <
                .40
            ){

                multiplier =
                    1.1;

            }

            else if(
                roll <
                .63
            ){

                multiplier =
                    1.5;

            }

            else if(
                roll <
                .80
            ){

                multiplier =
                    2;

            }

            else if(
                roll <
                .91
            ){

                multiplier =
                    3;

            }

            else if(
                roll <
                .97
            ){

                multiplier =
                    5;

            }

            else{

                multiplier =
                    10;

            }

        }

        else{

            if(
                roll <
                .36
            ){

                multiplier =
                    0;

            }

            else if(
                roll <
                .58
            ){

                multiplier =
                    1;

            }

            else if(
                roll <
                .75
            ){

                multiplier =
                    1.5;

            }

            else if(
                roll <
                .87
            ){

                multiplier =
                    2;

            }

            else if(
                roll <
                .95
            ){

                multiplier =
                    3;

            }

            else if(
                roll <
                .985
            ){

                multiplier =
                    5;

            }

            else{

                multiplier =
                    10;

            }

        }


        if(
            multiplier >
            0
        ){

            multiplier *=
                getMoneyMultiplier();

        }


        multiplier =
            roundMoney(
                multiplier
            );


        const payout =
            roundMoney(
                bet *
                multiplier
            );


        user.saldo =
            roundMoney(
                user.saldo +
                payout
            );


        const profit =
            roundMoney(
                payout -
                bet
            );


        recordGame(
            user,
            profit,
            "lucky"
        );


        saveUsers(
            users
        );


        return res.json({

            ok:true,

            bet:
                bet,

            multiplier:
                multiplier,

            payout:
                payout,

            profit:
                profit,

            saldo:
                user.saldo

        });

    }
);


// =====================================================
// =====================================================
// CRASH
// =====================================================
// =====================================================

const crashRounds =
    new Map();


// =====================================================
// CRASH MULTIPLIER NOW
// =====================================================

function crashMultiplierNow(
    round
){

    const elapsed =
        Math.max(

            0,

            Date.now() -
            round.startedAt

        );


    return roundMoney(

        1
        +
        elapsed /
        7000

    );

}


// =====================================================
// CRASH POINT
// =====================================================

function generateCrashPoint(){

    let roll =
        Math.random();


    if(
        isLuckActive()
    ){

        roll =
            Math.pow(
                roll,
                .78
            );

    }


    let crashAt;


    if(
        roll <
        .35
    ){

        crashAt =
            1.05
            +
            Math.random() *
            .75;

    }

    else if(
        roll <
        .68
    ){

        crashAt =
            1.8
            +
            Math.random() *
            2.2;

    }

    else if(
        roll <
        .88
    ){

        crashAt =
            4
            +
            Math.random() *
            6;

    }

    else if(
        roll <
        .97
    ){

        crashAt =
            10
            +
            Math.random() *
            20;

    }

    else{

        crashAt =
            30
            +
            Math.random() *
            70;

    }


    return roundMoney(

        Math.max(

            1.05,

            Math.min(
                100,
                crashAt
            )

        )

    );

}


// =====================================================
// CRASH PAGE
// =====================================================

app.get(
    "/game/crash",
    (
        req,
        res
    ) => {

        if(
            !isCrashEventActive()
        ){

            return res.redirect(
                "/panel"
            );

        }


        return v7GamePage(

            req,

            res,

            "Crash",

            "Wypłać zanim rakieta się rozbije.",

            "crash",

            `

${V7_EXTRA_GAME_CSS}


<div class="v7-crash-stage">


    <div class="v7-crash-header">


        <div>

            <div class="eyebrow">
                CRASH EVENT
            </div>

            <strong>
                🚀 LIVE
            </strong>

        </div>


        <div class="v7-crash-live">
            ● EVENT ACTIVE
        </div>


    </div>


    <div class="v7-crash-area">


        <div
            class="v7-crash-multiplier"
            id="crashMultiplier"
        >
            x1.00
        </div>


        <div
            class="v7-crash-rocket"
            id="crashRocket"
        >
            🚀
        </div>


        <div
            class="v7-crash-stop"
            id="crashStop"
        >

            RUNDA ZAKOŃCZYŁABY SIĘ PRZY

            <br>

            <strong id="crashStopValue">
                x—
            </strong>

        </div>


    </div>


    <div class="v7-crash-controls">


        <input
            id="crashBet"
            type="number"
            min="1"
            value="10"
        >


        <button id="crashStart">
            START
        </button>


        <button
            id="crashCashout"
            disabled
        >
            WYPŁAĆ
        </button>


    </div>


</div>

`,

            `

let crashToken =
    null;


let crashActive =
    false;


let crashPoll =
    null;


const crashMultiplier =
    document.getElementById(
        "crashMultiplier"
    );


const crashRocket =
    document.getElementById(
        "crashRocket"
    );


const crashStart =
    document.getElementById(
        "crashStart"
    );


const crashCashout =
    document.getElementById(
        "crashCashout"
    );


const crashStop =
    document.getElementById(
        "crashStop"
    );


const crashStopValue =
    document.getElementById(
        "crashStopValue"
    );


// =====================================================
// START
// =====================================================

crashStart.addEventListener(
    "click",
    async () => {

        if(
            crashActive
        ){

            return;

        }


        crashStart.disabled =
            true;


        crashStop.classList.remove(
            "visible"
        );


        crashStopValue.textContent =
            "x—";


        crashRocket.textContent =
            "🚀";


        crashRocket.style.left =
            "15%";


        crashRocket.style.bottom =
            "12%";


        crashMultiplier.classList.remove(
            "crashed"
        );


        crashMultiplier.textContent =
            "x1.00";


        const result =
            await api(
                "/api/crash/start",
                {

                    method:"POST",

                    body:
                        JSON.stringify({

                            bet:
                                Number(
                                    document
                                        .getElementById(
                                            "crashBet"
                                        )
                                        .value
                                )

                        })

                }
            );


        const data =
            result.data;


        if(
            !data.ok
        ){

            crashStart.disabled =
                false;


            showNotification(

                "error",

                "Crash",

                data.message ||
                "Nie udało się rozpocząć."

            );


            return;

        }


        crashToken =
            data.token;


        crashActive =
            true;


        crashCashout.disabled =
            false;


        crashRocket.classList.add(
            "flying"
        );


        updateBalance(
            data.saldo
        );


        startCrashPolling();

    }
);


// =====================================================
// POLL
// =====================================================

function startCrashPolling(){

    if(
        crashPoll
    ){

        clearInterval(
            crashPoll
        );

    }


    crashPoll =
        setInterval(
            async () => {

                if(
                    !crashActive
                ){

                    return;

                }


                const result =
                    await api(

                        "/api/crash/status?token="
                        +
                        encodeURIComponent(
                            crashToken
                        )

                    );


                const data =
                    result.data;


                if(
                    !data.ok
                ){

                    return;

                }


                crashMultiplier.textContent =
                    "x"
                    +
                    Number(
                        data.multiplier
                    )
                    .toFixed(
                        2
                    );


                const progress =
                    Math.min(

                        1,

                        (
                            Number(
                                data.multiplier
                            )
                            -
                            1
                        )
                        /
                        8

                    );


                crashRocket.style.left =
                    (
                        15
                        +
                        progress *
                        65
                    )
                    +
                    "%";


                crashRocket.style.bottom =
                    (
                        12
                        +
                        progress *
                        55
                    )
                    +
                    "%";


                if(
                    data.crashed
                ){

                    crashActive =
                        false;


                    clearInterval(
                        crashPoll
                    );


                    crashMultiplier.classList.add(
                        "crashed"
                    );


                    crashMultiplier.textContent =
                        "CRASH x"
                        +
                        Number(
                            data.crashAt
                        )
                        .toFixed(
                            2
                        );


                    crashRocket.classList.remove(
                        "flying"
                    );


                    crashRocket.textContent =
                        "💥";


                    crashCashout.disabled =
                        true;


                    crashStart.disabled =
                        false;


                    crashStopValue.textContent =
                        "x"
                        +
                        Number(
                            data.crashAt
                        )
                        .toFixed(
                            2
                        );


                    crashStop.classList.add(
                        "visible"
                    );


                    updateBalance(
                        data.saldo
                    );


                    showNotification(

                        "loss",

                        "CRASH!",

                        "Rakieta rozbiła się przy x"
                        +
                        Number(
                            data.crashAt
                        )
                        .toFixed(
                            2
                        )

                    );


                    setTimeout(
                        refreshBalance,
                        200
                    );

                }

            },
            280
        );

}


// =====================================================
// CASHOUT
// =====================================================

crashCashout.addEventListener(
    "click",
    async () => {

        if(
            !crashActive
        ){

            return;

        }


        crashCashout.disabled =
            true;


        const result =
            await api(
                "/api/crash/cashout",
                {

                    method:"POST",

                    body:
                        JSON.stringify({

                            token:
                                crashToken

                        })

                }
            );


        const data =
            result.data;


        if(
            !data.ok
        ){

            if(
                data.crashed
            ){

                crashActive =
                    false;


                clearInterval(
                    crashPoll
                );


                crashStart.disabled =
                    false;


                crashMultiplier.classList.add(
                    "crashed"
                );


                crashMultiplier.textContent =
                    "CRASH x"
                    +
                    Number(
                        data.crashAt
                    )
                    .toFixed(
                        2
                    );


                crashStopValue.textContent =
                    "x"
                    +
                    Number(
                        data.crashAt
                    )
                    .toFixed(
                        2
                    );


                crashStop.classList.add(
                    "visible"
                );

            }

            else{

                crashCashout.disabled =
                    false;

            }


            showNotification(

                "error",

                "Crash",

                data.message ||
                "Nie udało się wypłacić."

            );


            return;

        }


        crashActive =
            false;


        clearInterval(
            crashPoll
        );


        crashRocket.classList.remove(
            "flying"
        );


        crashStart.disabled =
            false;


        crashCashout.disabled =
            true;


        crashMultiplier.textContent =
            "x"
            +
            Number(
                data.multiplier
            )
            .toFixed(
                2
            );


        // =================================================
        // TUTAJ DOPIERO POKAZUJEMY PRAWDZIWY CRASH POINT
        // =================================================

        crashStopValue.textContent =
            "x"
            +
            Number(
                data.crashAt
            )
            .toFixed(
                2
            );


        crashStop.classList.add(
            "visible"
        );


        updateBalance(
            data.saldo
        );


        showNotification(

            "win",

            "Wypłacono!",

            money(
                data.payout
            )
            +
            " przy x"
            +
            Number(
                data.multiplier
            )
            .toFixed(
                2
            )
            +
            " • crash byłby x"
            +
            Number(
                data.crashAt
            )
            .toFixed(
                2
            )

        );


        setTimeout(
            refreshBalance,
            200
        );

    }
);

`

        );

    }
);


// =====================================================
// =====================================================
// CRASH START API
// =====================================================
// =====================================================

app.post(
    "/api/crash/start",
    (
        req,
        res
    ) => {

        if(
            !isCrashEventActive()
        ){

            return res.status(
                403
            )
            .json({

                ok:false,

                message:
                    "Crash działa tylko podczas Crash Event."

            });

        }


        if(
            !requireGameAvailable(
                req,
                res,
                "crash"
            )
        ){

            return;

        }


        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user,
            login

        } =
            account;


        const validation =
            validateBet(
                user,
                req.body?.bet
            );


        if(
            !validation.ok
        ){

            return res.status(
                400
            )
            .json({

                ok:false,

                saldo:
                    user.saldo,

                message:
                    validation.message

            });

        }


        for(
            const round
            of crashRounds.values()
        ){

            if(
                round.login ===
                login
            ){

                return res.status(
                    409
                )
                .json({

                    ok:false,

                    saldo:
                        user.saldo,

                    message:
                        "Masz już aktywną rundę Crash."

                });

            }

        }


        const bet =
            validation.bet;


        user.saldo =
            roundMoney(
                user.saldo -
                bet
            );


        const token =
            crypto
                .randomBytes(
                    24
                )
                .toString(
                    "hex"
                );


        crashRounds.set(

            token,

            {

                token:
                    token,

                login:
                    login,

                bet:
                    bet,

                startedAt:
                    Date.now(),

                crashAt:
                    generateCrashPoint()

            }

        );


        saveUsers(
            users
        );


        return res.json({

            ok:true,

            token:
                token,

            bet:
                bet,

            saldo:
                user.saldo

            // WAŻNE:
            // crashAt NIE JEST TUTAJ WYSYŁANE

        });

    }
);


// =====================================================
// =====================================================
// CRASH STATUS
// =====================================================
// =====================================================

app.get(
    "/api/crash/status",
    (
        req,
        res
    ) => {

        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user,
            login

        } =
            account;


        const token =
            String(
                req.query?.token || ""
            );


        const round =
            crashRounds.get(
                token
            );


        if(
            !round
            ||
            round.login !==
            login
        ){

            return res.status(
                404
            )
            .json({

                ok:false,

                message:
                    "Runda nie istnieje."

            });

        }


        const current =
            crashMultiplierNow(
                round
            );


        if(
            current >=
            round.crashAt
        ){

            const crashAt =
                round.crashAt;


            recordGame(
                user,
                -round.bet,
                "crash"
            );


            crashRounds.delete(
                token
            );


            saveUsers(
                users
            );


            return res.json({

                ok:true,

                crashed:true,

                multiplier:
                    crashAt,

                // dopiero teraz można pokazać crashAt

                crashAt:
                    crashAt,

                saldo:
                    user.saldo

            });

        }


        return res.json({

            ok:true,

            crashed:false,

            multiplier:
                current,

            saldo:
                user.saldo

            // crashAt celowo NIE wysyłamy

        });

    }
);


// =====================================================
// =====================================================
// CRASH CASHOUT
// =====================================================
// =====================================================

app.post(
    "/api/crash/cashout",
    (
        req,
        res
    ) => {

        const account =
            requireGameAccount(
                req,
                res
            );


        if(
            !account
        ){

            return;

        }


        const {

            users,
            user,
            login

        } =
            account;


        const token =
            String(
                req.body?.token || ""
            );


        const round =
            crashRounds.get(
                token
            );


        if(
            !round
            ||
            round.login !==
            login
        ){

            return res.status(
                404
            )
            .json({

                ok:false,

                message:
                    "Runda nie istnieje."

            });

        }


        const multiplier =
            crashMultiplierNow(
                round
            );


        // =================================================
        // ZA PÓŹNO
        // =================================================

        if(
            multiplier >=
            round.crashAt
        ){

            const crashAt =
                round.crashAt;


            recordGame(
                user,
                -round.bet,
                "crash"
            );


            crashRounds.delete(
                token
            );


            saveUsers(
                users
            );


            return res.status(
                409
            )
            .json({

                ok:false,

                crashed:true,

                message:
                    "Za późno — rakieta już się rozbiła.",

                crashAt:
                    crashAt,

                saldo:
                    user.saldo

            });

        }


        // =================================================
        // MONEY x2 / x3
        // =================================================

        const normalProfit =
            round.bet
            *
            (
                multiplier -
                1
            );


        const boostedProfit =
            normalProfit
            *
            getMoneyMultiplier();


        const payout =
            roundMoney(

                round.bet
                +
                boostedProfit

            );


        const profit =
            roundMoney(
                payout -
                round.bet
            );


        const finalMultiplier =
            roundMoney(
                payout /
                round.bet
            );


        // =================================================
        // WAŻNE
        //
        // zapamiętujemy crashAt ZANIM usuniemy rundę
        // =================================================

        const crashAt =
            round.crashAt;


        user.saldo =
            roundMoney(
                user.saldo +
                payout
            );


        recordGame(
            user,
            profit,
            "crash"
        );


        crashRounds.delete(
            token
        );


        saveUsers(
            users
        );


        return res.json({

            ok:true,

            multiplier:
                multiplier,

            finalMultiplier:
                finalMultiplier,

            eventMultiplier:
                getMoneyMultiplier(),

            payout:
                payout,

            profit:
                profit,

            // =================================================
            // DOPIERO PO CASHOUT:
            // POKAZUJEMY GDZIE RAKIETA BY SIĘ ROZBIŁA
            // =================================================

            crashAt:
                crashAt,

            saldo:
                user.saldo

        });

    }
);


// =====================================================
// =====================================================
// KONIEC SERVER.JS V7 — CZĘŚĆ 5/6
// =====================================================
//
// ZOSTAŁA OSTATNIA CZĘŚĆ:
//
// 6/6
//
// ✅ CLEANUP:
//    Miner
//    Tower
//    Crash
//
// ✅ EVENT CLEANUP
//
// ✅ HEALTH CHECK
//
// ✅ 404
//
// ✅ ERROR HANDLER
//
// ✅ GRACEFUL SHUTDOWN
//
// ✅ JEDYNE:
//    app.listen(...)
//
// =====================================================
// =====================================================
// =====================================================
//                  7BETS SERVER
//                 POPRAWIONY V7
// =====================================================
// =====================================================
//
// SERVER.JS — CZĘŚĆ 6/6
//
// ✅ CLEANUP MINER
// ✅ CLEANUP TOWER
// ✅ CLEANUP CRASH
// ✅ CLEANUP EVENTÓW
//
// ✅ HEALTH CHECK
// ✅ SERVER STATUS
//
// ✅ 404
// ✅ ERROR HANDLER
//
// ✅ BEZPIECZNE ZAMYKANIE
//
// ✅ JEDYNE app.listen()
//
// WKLEJ POD 5/6
//
// =====================================================


// =====================================================
// =====================================================
// CLEANUP — POMOCNICZE
// =====================================================
// =====================================================

function findUserForCleanup(
    users,
    login
){

    const wanted =
        String(
            login || ""
        )
        .trim()
        .toLowerCase();


    if(
        !wanted
    ){

        return null;

    }


    for(
        const [
            key,
            user
        ]
        of Object.entries(
            users
        )
    ){

        if(
            String(
                key
            )
            .toLowerCase()
            ===
            wanted
        ){

            return user;

        }


        if(
            String(
                user?.login || ""
            )
            .toLowerCase()
            ===
            wanted
        ){

            return user;

        }

    }


    return null;

}


// =====================================================
// =====================================================
// CLEANUP POJEDYNCZEJ MAPY RUND
// =====================================================
// =====================================================
//
// STAWKA ZOSTAŁA POBRANA PRZY START,
// WIĘC PRZY WYGASŁEJ RUNDZIE
// NIE ODEJMUJEMY KASY DRUGI RAZ.
//
// =====================================================

function cleanupRoundMap(
    map,
    users,
    gameName,
    maxAge
){

    const now =
        Date.now();


    let changed =
        false;


    for(
        const [
            token,
            round
        ]
        of map.entries()
    ){

        const startedAt =
            Number(

                round?.createdAt

                ||

                round?.startedAt

                ||

                0

            );


        if(
            !startedAt
        ){

            continue;

        }


        if(
            now -
            startedAt
            <
            maxAge
        ){

            continue;

        }


        // =================================================
        // USER
        // =================================================

        const user =
            findUserForCleanup(
                users,
                round?.login
            );


        const bet =
            roundMoney(
                round?.bet || 0
            );


        if(
            user
            &&
            bet >
            0
        ){

            ensureStats(
                user,
                round?.login
            );


            recordGame(

                user,

                -bet,

                gameName

            );


            notifyUser(

                user,

                "info",

                "Runda wygasła",

                (
                    gameName.toUpperCase()
                    +
                    " został automatycznie zakończony z powodu braku aktywności."
                )

            );


            changed =
                true;

        }


        map.delete(
            token
        );


        console.log(

            "🧹 Usunięto starą rundę:",

            gameName,

            round?.login || "?"

        );

    }


    return changed;

}


// =====================================================
// =====================================================
// CLEANUP WSZYSTKICH RUND
// =====================================================
// =====================================================

function cleanupOldRounds(){

    try{

        const users =
            loadUsers();


        let changed =
            false;


        // =================================================
        // MINER — 30 MIN
        // =================================================

        if(
            cleanupRoundMap(

                minerRounds,

                users,

                "miner",

                30 *
                60 *
                1000

            )
        ){

            changed =
                true;

        }


        // =================================================
        // TOWER — 30 MIN
        // =================================================

        if(
            cleanupRoundMap(

                towerRounds,

                users,

                "tower",

                30 *
                60 *
                1000

            )
        ){

            changed =
                true;

        }


        // =================================================
        // CRASH — 15 MIN
        // =================================================

        if(
            cleanupRoundMap(

                crashRounds,

                users,

                "crash",

                15 *
                60 *
                1000

            )
        ){

            changed =
                true;

        }


        if(
            changed
        ){

            saveUsers(
                users
            );

        }

    }

    catch(error){

        console.error(
            "❌ CLEANUP ERROR:"
        );


        console.error(
            error
        );

    }

}


// =====================================================
// CLEANUP CO 60 SEKUND
// =====================================================

const roundCleanupTimer =
    setInterval(

        cleanupOldRounds,

        60 *
        1000

    );


if(
    typeof roundCleanupTimer.unref ===
    "function"
){

    roundCleanupTimer.unref();

}


// =====================================================
// =====================================================
// CLEANUP EVENTÓW
// =====================================================
// =====================================================
//
// loadEvents() automatycznie usuwa
// wygasłe eventy z events.json.
//
// =====================================================

function cleanupExpiredEvents(){

    try{

        loadEvents();

    }

    catch(error){

        console.error(
            "❌ EVENT CLEANUP ERROR:",
            error.message
        );

    }

}


const eventCleanupTimer =
    setInterval(

        cleanupExpiredEvents,

        30 *
        1000

    );


if(
    typeof eventCleanupTimer.unref ===
    "function"
){

    eventCleanupTimer.unref();

}


// =====================================================
// =====================================================
// NORMALIZACJA USERS.JSON PRZY STARCIE
// =====================================================
// =====================================================

try{

    normalizeUsers();


    console.log(
        "✅ users.json sprawdzony."
    );

}

catch(error){

    console.error(
        "❌ Nie udało się sprawdzić users.json:"
    );


    console.error(
        error
    );

}


// =====================================================
// =====================================================
// HEALTH
// =====================================================
// =====================================================

app.get(
    "/health",
    (
        req,
        res
    ) => {

        return res.json({

            ok:
                true,

            service:
                "7BETS",

            version:
                "V7",

            status:
                "online",

            uptime:
                Math.floor(
                    process.uptime()
                ),

            time:
                Date.now()

        });

    }
);


// =====================================================
// API HEALTH
// =====================================================

app.get(
    "/api/health",
    (
        req,
        res
    ) => {

        return res.json({

            ok:
                true,

            online:
                true,

            server:
                "7BETS V7",

            timestamp:
                Date.now(),

            uptimeSeconds:
                Math.floor(
                    process.uptime()
                )

        });

    }
);


// =====================================================
// =====================================================
// SERVER STATUS
// =====================================================
// =====================================================

app.get(
    "/api/server-status",
    (
        req,
        res
    ) => {

        const maintenance =
            loadMaintenance();


        const settings =
            loadSettings();


        const events =
            loadEvents();


        return res.json({

            ok:
                true,


            server:{

                online:
                    true,

                version:
                    "V7",

                maintenance:
                    maintenance.server ===
                    true,

                uptime:
                    Math.floor(
                        process.uptime()
                    )

            },


            economy:{

                enabled:
                    settings.economyEnabled ===
                    true,

                rewards:
                    settings.rewardsEnabled ===
                    true,

                registrations:
                    settings.registrationsEnabled ===
                    true

            },


            events:{

                active:
                    events.length,

                luck:
                    isLuckActive(),

                moneyMultiplier:
                    getMoneyMultiplier(),

                crash:
                    isCrashEventActive()

            },


            rounds:{

                miner:
                    minerRounds.size,

                tower:
                    towerRounds.size,

                crash:
                    crashRounds.size

            }

        });

    }
);


// =====================================================
// =====================================================
// DEBUG — AKTYWNE GRY
// =====================================================
// =====================================================
//
// NIE POKAZUJEMY:
// - BOMB
// - crashAt
// - TOKENÓW RUND
//
// ŻEBY GRACZ NIE MÓGŁ SOBIE
// PODGLĄDAĆ WYNIKÓW.
//
// =====================================================

app.get(
    "/api/game-status",
    (
        req,
        res
    ) => {

        const account =
            getSessionUser(
                req
            );


        if(
            !account
        ){

            return res.status(
                401
            )
            .json({

                ok:false,

                message:
                    "Musisz się zalogować."

            });

        }


        const login =
            account.login;


        let miner =
            false;


        let tower =
            false;


        let crash =
            false;


        for(
            const round
            of minerRounds.values()
        ){

            if(
                round.login ===
                login
            ){

                miner =
                    true;

                break;

            }

        }


        for(
            const round
            of towerRounds.values()
        ){

            if(
                round.login ===
                login
            ){

                tower =
                    true;

                break;

            }

        }


        for(
            const round
            of crashRounds.values()
        ){

            if(
                round.login ===
                login
            ){

                crash =
                    true;

                break;

            }

        }


        return res.json({

            ok:true,

            active:{

                miner:
                    miner,

                tower:
                    tower,

                crash:
                    crash

            }

        });

    }
);


// =====================================================
// =====================================================
// 404
// =====================================================
// =====================================================
//
// MUSI BYĆ PO WSZYSTKICH ROUTACH.
//
// =====================================================

app.use(
    (
        req,
        res
    ) => {

        // =================================================
        // API
        // =================================================

        if(
            req.path.startsWith(
                "/api/"
            )
        ){

            return res
                .status(
                    404
                )
                .json({

                    ok:false,

                    code:
                        "NOT_FOUND",

                    message:
                        "Nie znaleziono takiego endpointu."

                });

        }


        // =================================================
        // STRONA
        // =================================================

        return res
            .status(
                404
            )
            .send(

                layout(

                    "404",

                    `

<div class="auth-wrap">


    <section
        class="glass auth-card"
        style="
            width:min(520px,100%);
            margin:auto;
            text-align:center
        "
    >


        <div
            style="
                font-size:68px;
                margin-bottom:12px
            "
        >
            🎰
        </div>


        <div class="eyebrow">
            ERROR 404
        </div>


        <h2>
            Nie znaleziono strony
        </h2>


        <p class="muted">

            Ta strona nie istnieje
            albo została przeniesiona.

        </p>


        <a
            href="/"
            class="btn"
            style="
                margin-top:15px
            "
        >
            WRÓĆ DO 7BETS
        </a>


    </section>


</div>

`

                )

            );

    }
);


// =====================================================
// =====================================================
// ERROR HANDLER
// =====================================================
// =====================================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error("");
        console.error(
            "=============================================="
        );

        console.error(
            "❌ 7BETS SERVER ERROR"
        );

        console.error(
            "METHOD:",
            req.method
        );

        console.error(
            "URL:",
            req.originalUrl
        );

        console.error(
            "MESSAGE:",
            error?.message
        );

        console.error(
            error
        );

        console.error(
            "=============================================="
        );

        console.error("");


        if(
            res.headersSent
        ){

            return next(
                error
            );

        }


        // =================================================
        // API ERROR
        // =================================================

        if(
            req.path.startsWith(
                "/api/"
            )
        ){

            return res
                .status(
                    500
                )
                .json({

                    ok:false,

                    code:
                        "SERVER_ERROR",

                    message:
                        "Wystąpił błąd serwera 7BETS."

                });

        }


        // =================================================
        // PAGE ERROR
        // =================================================

        return res
            .status(
                500
            )
            .send(

                layout(

                    "Błąd",

                    `

<div class="auth-wrap">


    <section
        class="glass auth-card"
        style="
            width:min(520px,100%);
            margin:auto;
            text-align:center
        "
    >


        <div
            style="
                font-size:65px;
                margin-bottom:12px
            "
        >
            ⚠️
        </div>


        <div class="eyebrow">
            SERVER ERROR
        </div>


        <h2>
            Wystąpił błąd
        </h2>


        <p class="muted">

            Serwer 7BETS napotkał problem.

            <br><br>

            Sprawdź okno CMD,
            ponieważ tam pojawił się
            dokładny błąd.

        </p>


        <a
            href="/"
            class="btn"
            style="
                margin-top:15px
            "
        >
            STRONA GŁÓWNA
        </a>


    </section>


</div>

`

                )

            );

    }
);


// =====================================================
// =====================================================
// START SERWERA
// =====================================================
// =====================================================
//
// ⚠️ TO MA BYĆ JEDYNE app.listen()
// W CAŁYM server.js.
//
// NIE WKLEJAJ POD TYM
// STAREGO app.listen().
//
// 0.0.0.0 POZWALA NA:
// ✅ localhost
// ✅ LAN
// ✅ cloudflared
//
// =====================================================

const server7Bets =
    app.listen(

        PORT,

        "0.0.0.0",

        () => {

            console.log("");
            console.log(
                "=============================================="
            );

            console.log(
                "           🎰 7BETS V7 ONLINE"
            );

            console.log(
                "=============================================="
            );

            console.log("");


            console.log(
                `🌐 LOCAL: http://localhost:${PORT}`
            );


            console.log(
                `🔌 PORT: ${PORT}`
            );


            console.log("");
            console.log(
                "✅ Login / Rejestracja"
            );

            console.log(
                "✅ Discord linking"
            );

            console.log(
                "✅ Aktualizacja salda LIVE"
            );

            console.log(
                "✅ Nagroda czasowa"
            );

            console.log(
                "✅ Bonus startowy"
            );

            console.log(
                "✅ Skrzynki 1 / 2 / 3 / 5 / 10 / 25"
            );

            console.log(
                "✅ 25 skrzynek = 25 animacji"
            );

            console.log(
                "✅ Miner"
            );

            console.log(
                "✅ Miner — aktualny zysk"
            );

            console.log(
                "✅ Miner — wszystkie bomby po przegranej"
            );

            console.log(
                "✅ Tower"
            );

            console.log(
                "✅ Zdrapka"
            );

            console.log(
                "✅ Sloty"
            );

            console.log(
                "✅ Ruletka"
            );

            console.log(
                "✅ Lucky Orb"
            );

            console.log(
                "✅ Crash Event"
            );

            console.log(
                "✅ Crash pokazuje crashAt po zakończeniu"
            );

            console.log(
                "✅ Event LUCK"
            );

            console.log(
                "✅ MONEY x2 / x3"
            );

            console.log(
                "✅ Okrągły timer eventu"
            );

            console.log(
                "✅ Malejący outline eventu"
            );

            console.log(
                "✅ Przerwa techniczna"
            );

            console.log(
                "✅ Powiadomienia"
            );

            console.log(
                "✅ Dźwięki"
            );


            console.log("");
            console.log(
                "=============================================="
            );

        }

    );


// =====================================================
// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================
// =====================================================

let shuttingDown =
    false;


function shutdown7Bets(
    signal
){

    if(
        shuttingDown
    ){

        return;

    }


    shuttingDown =
        true;


    console.log("");
    console.log(
        "=============================================="
    );

    console.log(
        `🛑 ${signal} — zamykanie 7BETS...`
    );

    console.log(
        "=============================================="
    );


    // =================================================
    // STOP TIMERÓW
    // =================================================

    clearInterval(
        roundCleanupTimer
    );


    clearInterval(
        eventCleanupTimer
    );


    // =================================================
    // OSTATNIE CZYSZCZENIE
    // =================================================

    try{

        cleanupOldRounds();

    }

    catch(error){

        console.error(
            "Final cleanup error:",
            error.message
        );

    }


    // =================================================
    // CLOSE
    // =================================================

    server7Bets.close(
        () => {

            console.log(
                "✅ Serwer 7BETS został bezpiecznie zamknięty."
            );


            process.exit(
                0
            );

        }
    );


    // =================================================
    // FORCE EXIT
    // =================================================

    const forceExit =
        setTimeout(
            () => {

                console.error(
                    "❌ Serwer nie zamknął się w 5 sekund."
                );

                console.error(
                    "Wymuszone zakończenie."
                );


                process.exit(
                    1
                );

            },
            5000
        );


    if(
        typeof forceExit.unref ===
        "function"
    ){

        forceExit.unref();

    }

}


// =====================================================
// CTRL + C
// =====================================================

process.once(
    "SIGINT",
    () => {

        shutdown7Bets(
            "SIGINT"
        );

    }
);


// =====================================================
// SYSTEM / TASK MANAGER
// =====================================================

process.once(
    "SIGTERM",
    () => {

        shutdown7Bets(
            "SIGTERM"
        );

    }
);


// =====================================================
// =====================================================
// UNHANDLED ERROR LOGGING
// =====================================================
// =====================================================

process.on(
    "unhandledRejection",
    reason => {

        console.error("");
        console.error(
            "❌ UNHANDLED PROMISE REJECTION:"
        );

        console.error(
            reason
        );

    }
);


process.on(
    "uncaughtException",
    error => {

        console.error("");
        console.error(
            "❌ UNCAUGHT EXCEPTION:"
        );

        console.error(
            error
        );

    }
);


// =====================================================
// =====================================================
// SERVER.JS V7 — GOTOWY
// =====================================================
// =====================================================
//
// KOLEJNOŚĆ:
//
// 1/6
// 2/6
// 3/6
// 4/6
// 5/6
// 6/6
//
// I NIC ZE STAREGO server.js POD TYM.
//
// =====================================================