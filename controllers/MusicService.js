'use strict';

var fs = require('fs');
var log = require('log4js').getLogger ("api-host");
const basePath = 'data/music.';

module.exports.getAlbums = function getHosts (req, res, next) {
  // covers '/api/music/albums'
  // as well as '/api/music/albums/34' - it is a wish til now
  fs.readFile(basePath + 'album.json',
    'utf8', function (err, data) {
      if (err) 
        res.status(500).send (JSON.stringify(err));
      else {
        let aAlbum = JSON.parse(data);
        res.json(aAlbum);
      }
    });
}

module.exports.getTitles = function wakeHost (req, res, next) {
  let params = req.swagger.params;
  fs.readFile(basePath + 'title.json', 
    'utf8', function (err, data) {
      if (err) 
        res.status(500).send (JSON.stringify(err));
      else {
        let aTitle = JSON.parse(data);
        if (params.albumId.value) {
          res.json(aTitle.filter(function (title) {
            return title.albumId==params.albumId.value;
          }));
        } else res.json(aTitle);
      }
});
}
