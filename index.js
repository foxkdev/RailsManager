'use strict';
const {app, Menu, Tray, shell, dialog} = require('electron')
const path = require('path')
const command = require('shelljs/global')

const jquery = require('jquery')
const fs = require('fs')

const notifier = require('node-notifier');
const jsonfile = require('jsonfile')

const trayActive = 'assets/trayIcon.png'

let tray = null




app.on('ready', () =>
{
  tray = new Tray(path.join(__dirname, trayActive))

  var details = function(callback){

    var getFile = exec('cd ~ && pwd', {silent:true,async:true})
    getFile.stdout.on('data', function(data){
      var box = []
      fs.readFile(data.trim()+'/Documents/RailsManager/projects.json', 'utf8', function (err, data){
        if (err) throw err
        var jsonData = JSON.parse(data)
        for(var index in jsonData) {
          box.push({
            'name': jsonData[index].name,
            'path': jsonData[index].path,
            'status': jsonData[index].status,
            'port': jsonData[index].port
          });

        }
        return callback(box)
      })
    })
  }
  var railsManager = function(e){
    tray.setImage(path.join(__dirname, trayActive))

    details(function(box){
      var menu = [
        {
          label: "Refresh",
          click: function()
          {
            railsManager()
          }
        },
        {
          type: "separator"
        }]
      for(var index in box){
        var status = box[index]["status"] ? 'Started' : 'Stoped'
        menu.push({
          label: box[index]['name'],
          id: 'projects',
          icon: path.join(__dirname, 'assets/'+box[index]['status']+'.png'),
          submenu: [
            {
              label: 'Start Server',
              id: box[index]['path'],
              enabled: !box[index]['status'],
              sublabel: index,
              click: function(menuItem) {
                var port = 300+menuItem.sublabel
								runShell(contextMenu, menuItem, "rails server", port)
                notifier.notify({
                  'title': '[RAILSMANAGER]',
                  'subtitle': box[index-1]['name']+ ' is Started!',
                  'message': 'RailsManager start server in port: '+box[index-1]['port'],
                  sound: true,
                  timeout: 3
                });
							}

            },
            {
              label: 'Close Server',
              id: box[index]['path'],
              enabled: box[index]['status'],
              sublabel: index,
              click: function(menuItem) {
								runShell(contextMenu, menuItem, "kill -9 `cat tmp/pids/server.pid` && clear")
                notifier.notify({
                  'title': '[RAILSMANAGER]',
                  'subtitle': box[index-1]['name']+ ' is Stoped!',
                  'message': 'RailsManager stop server in port: '+box[index-1]['port'],
                  sound: true,
                  timeout: 3
                });

							}

            },
            {
              type: "separator"
            },
            {
              label: 'Open Browser',
              id: box[index]['path'],
              sublabel: index,
              click: function(menuItem) {
                var port = 300+menuItem.sublabel
                shell.openExternal('http://localhost:'+port)
							}

            },
            {
              label: 'Open Terminal',
              id: box[index]['path'],
              click: function(menuItem) {
								runShell(contextMenu, menuItem, "open -a 'Terminal.app' "+box[index]['path'])
							}

            },
            {
              label: 'Open Folder',
              id: box[index]['path'],
              sublabel: index,
              click: function() {
                shell.openItem(box[index]['path'])

							}

            },
            {
              label: 'Remove Project',
              id: box[index]['path'],
              sublabel: index,
              click: function() {
                removeProject(index, function(status){
                  if(status){
                    notifier.notify({
                      'title': '[RAILSMANAGER]',
                      'subtitle': 'Project is Removed!',
                      'message': 'RailsManager remove a project',
                      sound: true,
                      timeout: 3
                    });
                  }
                  railsManager()
                })

							}

            },
            {
              type: "separator"
            },
            {
              label: 'Status: '+status,
              id: box[index]['path'],
              sublabel: index,
              enabled: false
            },
            {
              label: 'Port: '+box[index]['port'],
              id: box[index]['path'],
              sublabel: index,
              enabled: false
            }
          ]
        })
      }
      menu.push({
        type: "separator"
      })
      menu.push({
          label: 'Add Project',
          click: function(){
            dialog.showOpenDialog({properties: ['openDirectory']}, function(dir){
              if(dir){
                addProject(dir[0], function(status){
                  railsManager()

                })

              }

            })
          }
      })
      menu.push({
        type: "separator"
      })
      menu.push({
        label: 'Version: '+app.getVersion(),
        enabled: false
      })
      menu.push({
        label: 'About',
        click: function(){
          shell.openExternal('https://github.com/kloppz')
        }
      })
      menu.push({
        label: 'Quit',
        click: function(){
          dialog.showMessageBox({type: "question", buttons: ["Exit", "Continue"], title: 'Quit App', message: 'Are you sure to close RailsManager App?', detail: 'RailsManager close all Ruby on Rails servers when close app'}, function(res){
            console.log(res)
            if(res == 0){
              quitApp()
            }
          })
          //quitApp()
        }
      })
      var contextMenu = Menu.buildFromTemplate(menu)
      tray.setToolTip('Rails Manager')
      tray.setContextMenu(contextMenu)
      //console.log(contextMenu)

    })

  }

  let runShell = function(contextMenu, menuItem, command, port= false)
	{

		//tray.setImage(path.join(__dirname, trayWait))
		//contextMenu.items[0].enabled = false
    menuItem.enabled = false
		tray.setContextMenu(contextMenu)
    var puerto = ''
    if(port != false){
      puerto = ' -p '+port
    }
    console.log(menuItem.sublabel)
    if(menuItem.sublabel != ''){
      setStatus(menuItem.sublabel, function(stat){
        if(stat){
          let shellCommand = new exec('cd ' + menuItem.id + ' && '+ command + puerto, function(code, stdout, stderr)
      		{
      			// console.log('Exit code:', code)
      			// console.log('Program output:', stdout)
      			// console.log('Program stderr:', stderr)
            //leemos archivo json
            //si esta activo false pasamos a true el status
            //editConfig('status', 'switch')
              railsManager()
      		})
          railsManager()
        }
      })
    }else{
      railsManager()
    }


	}
  var setStatus = function(index, callback){
    getProjectsJson(function(obj){
      obj[index].status = !obj[index].status
      getBasePath(function(data){
        jsonfile.writeFile(data+'/Documents/RailsManager/projects.json', obj, {spaces: 2}, function (err) {
          if (err) throw err
          return callback(true)
        })
      })
    })
  }
  var removeProject = function(index, callback){
    getProjectsJson(function(obj){
      obj.splice(index, 1)
      getBasePath(function(data){
        jsonfile.writeFile(data+'/Documents/RailsManager/projects.json', obj, {spaces: 2}, function (err) {
          if (err) throw err
          return callback(true)
        })
      })
    })
  }
  var addProject = function(path, callback){
    var name = path.split('/')
    var name = name[name.length-1]
    getProjectsJson(function(obj){
      var action = true
      var last_port = 2999
      if(obj.length >= 1){
        obj.forEach(function(item){
          if(item.name == name){
            action = false
            return
          }
        })
        last_port = obj[obj.length-1].port
      }
      if(action){
        var port = last_port+1
        obj.push({
          "name": name,
          "path": path,
          "status": false,
          "port": port
        })
        getBasePath(function(data){
          jsonfile.writeFile(data+'/Documents/RailsManager/projects.json', obj, {spaces: 2}, function (err) {
            if (err) throw err
              notifier.notify({
                'title': '[RAILSMANAGER]',
                'subtitle': name+ ' is Added!',
                'message': 'RailsManager added server in port: '+port,
                sound: true,
                timeout: 3
              });


            return callback(true)
          })
        })
      }else{
        notifier.notify({
          'title': '[RAILSMANAGER]',
          'subtitle': 'Project exists!',
          'message': 'RailsManager have this project added',
          sound: true,
          timeout: 3
        });
        return callback(false)
      }


    })

  }
  var getProjectsJson = function(callback){
    getBasePath(function(data){
      jsonfile.readFile(data+'/Documents/RailsManager/projects.json', function(err, obj) {
        if (err) throw err
        return callback(obj)
      })
    })

  }
  var getBasePath = function(callback){
    var getFile = exec('cd ~ && pwd', {silent:true,async:true})
    getFile.stdout.on('data', function(data){
      return callback(data.trim())
    })
  }
  var quitApp = function(){
    getProjectsJson(function(obj){
      var action = false
      var exe = false
      obj.forEach(function(item){
        if(item.status == true){
          item.status = false
          let shellCommand = new exec('cd ' + item.path + ' && kill -9 `cat tmp/pids/server.pid`', function(code, stdout, stderr)
      		{
              exe = true
              action = true
      		})
        }
      })
      if(action || exe == false){
        getBasePath(function(data){
          jsonfile.writeFile(data+'/Documents/RailsManager/projects.json', obj, {spaces: 2}, function (err) {
            if (err) throw err
            app.quit()
          })
        })

      }
    })
  }
  var installRailsManager = function(callback){
    getBasePath(function(data){
      jsonfile.readFile(data+'/Documents/RailsManager/projects.json', function(err, obj) {
        if(err){ //no esta creada
          fs.mkdir(data+'/Documents/RailsManager/', function(res){
              var obj = []
              jsonfile.writeFile(data+'/Documents/RailsManager/projects.json', obj, {spaces: 2}, function (err) {
                console.log(err)
                return callback(true)
              })
          })
        }
        return callback(true)
      })
    })
  }
  installRailsManager(function(stat){
    railsManager()
  })







})
