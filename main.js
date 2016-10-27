const {app, BrowserWindow} = require('electron')
const shell = require('shelljs/global');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  //win.webContents.openDevTools()


   var cmd=require('node-cmd');


   cmd.get(
       'mkdir test',
       function(data){
           console.log('the current dir contains these files :\n\n',data)
       }
   );
   cmd.get(
        `
            cd test
            git clone https://github.com/RIAEvangelist/node-cmd.git
            cd node-cmd
            ls
        `,
        function(data){
            console.log('the node-cmd cloned dir contains these files :\n\n',data)
        }
    );

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})
