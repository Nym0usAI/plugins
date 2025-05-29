{
  "firefox": {
    "enable": true,
    "context": {
      "keepopen": true,
      "keepalive": 20,
      "min": 15,
      "max": 25
    },
    "Headless": true
  },
  "chromium": {
    "enable": false
  },
  "disableEng": true,
  "typecache": "mem",
  "isarm": true,
  "mikrotik": true,
  "rch": {
    "keepalive": 300,
    "permanent_connection": true
  },
  "serverproxy": {
    "verifyip": false,
    "image": {
      "cache": false,
      "cache_rsize": false
    }
  },
  "dlna": {
    "cover": {
      "coverComand": "-n -ss 3:00 -i \"{file}\" -vf \"thumbnail=150,scale=-2:240\" -frames:v 1 \"{thumb}\""
    }
  },
  "openstat": {
    "enable": true
  },
  "defaultOn": "disable",
  "tmdb": {
    "cache_img": 20
  },