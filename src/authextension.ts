'use strict';

import * as vscode from 'vscode';

import { Apiendpoint } from './apiendpoint';

export module authextension {

    const request = require('request');
    export let authorize_f8_analytics: any;
    export let get_access_token_osio: any;

    authorize_f8_analytics = (context, cb) => {
         vscode.window.showInformationMessage('Click "Get token from OSIO" for login. Copy the token displayed and then click "Authorize" to approve Fabric8 analytics','Get token from OSIO','Authorize').then((selection) => {
            console.log(selection);
            if(selection == 'Get token from OSIO'){
                vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://auth.openshift.io/api/login?redirect=https://api.openshift.io/api/status'))
            } else if(selection == 'Authorize'){
                let options = {
                prompt: "Action: Enter openshift.io auth token",
                placeHolder: "Please provide your auth token, can be retrieved from OSIO"
                }
                vscode.window.showInputBox(options).then(value => {
                    if (!value) return;
                    // Apiendpoint.STACK_API_TOKEN = value;
                    // process.env['RECOMMENDER_API_TOKEN'] = Apiendpoint.STACK_API_TOKEN;
                    // context.globalState.update('lastTagged', Apiendpoint.STACK_API_TOKEN);
                    //let pcb = cb;
                    Apiendpoint.OSIO_REFRESH_TOKEN = value;
                    get_access_token_osio(Apiendpoint, context, cb);
                    // cb(true);
                });
            }
        });
  }


    get_access_token_osio = (Apiendpoint, context, cb) => {
        let bodyData: any = {'refresh_token': `${Apiendpoint.OSIO_REFRESH_TOKEN}`};
        let options = {};
        options['url'] = `${Apiendpoint.OSIO_AUTH_URL}`;
        options['method'] = 'POST';
        options['headers'] = {'Content-Type': 'application/json'};
        options['body'] = JSON.stringify(bodyData);
        request(options, (err, httpResponse, body) => {
          if ((httpResponse.statusCode == 200 || httpResponse.statusCode == 202)) {
            let resp = JSON.parse(body);
            if (resp && resp.token) {
                Apiendpoint.STACK_API_TOKEN = resp.token.access_token;
                process.env['RECOMMENDER_API_TOKEN'] = Apiendpoint.STACK_API_TOKEN;
                context.globalState.update('lastTagged', Apiendpoint.STACK_API_TOKEN);
                vscode.window.showInformationMessage('Successfully authorized');
                cb(true);
            } else {
                vscode.window.showErrorMessage(`Failed with Status code : ${httpResponse.statusCode}`);
                cb(null);
            }
          } else if(httpResponse.statusCode == 401){
              vscode.window.showErrorMessage(`Looks like your token is not proper, kindly try again`);
              cb(null);
          } else {   
            vscode.window.showErrorMessage(`Looks like your token is not proper, kindly try again, Status: ${httpResponse.statusCode}`);
            cb(null);
          }
        });
    }
}