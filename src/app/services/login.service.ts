import { ConnectionStatus, NetworkService } from './network.service';
import { Observable, from } from 'rxjs';
import { User, UserResponse } from '../models/user-model';
import { catchError, map, switchMap, take, timeout } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LocalStorageKeys } from '../enums/local-storage-keys.enums';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private loginurl = 'https://cmg.mexicanadegas.com.mx:8190/webapp/rest/webappService/login?usr=';
  constructor(
    private http: HttpClient,
    private networkService: NetworkService,
    private storage: Storage) { }

  public login(user: string, password: string): Observable<User> {
    if (this.networkService.getCurrentNetworkStatus() === ConnectionStatus.Offline) {
      return this.loginWithNoConection(user, password);
    } else {
      return this.http.get(this.loginurl + user + '&pwd=' + password).pipe(
        timeout(3000),
        map((response: UserResponse) => response.dsdatos.usuario[0]),
        take(1),
        switchMap((response) => {
          if (response && response.mensaje === 'OK') {
            response.contraseña = password;
            return this.setLocalUser(response);
          } else {
            return [new User()];
          }
        }),
        catchError((err) => {
          return this.loginWithNoConection(user, password);
        })
      );
    }
  }

  // dev only methods
  public getLocalCredentials(): Observable<User> {
    return this.getLocalUser();
  }

  public deleteLocalData(): void {
    console.log('localCredentials deleted!');
    this.storage.remove(`${LocalStorageKeys.USER_KEY}-${LocalStorageKeys.USER_INFO}`);
  }
  // end of dev only methods

  private loginWithNoConection(user: string, password: string): Observable<User> {
    return this.getLocalUser().pipe(
      take(1),
      switchMap((localUser: User) => {
        if (localUser && localUser.id === user && localUser.contraseña === password) {
          return [localUser];
        } else {
          return [new User()];
        }
      })
    );
  }

  // Set user locally
  private setLocalUser(data: User): Observable<User> {
    return from(this.storage.set(`${LocalStorageKeys.USER_KEY}-${LocalStorageKeys.USER_INFO}`, data));
  }

  // Get user saved locally
  private getLocalUser(): Observable<User> {
    return from(this.storage.get(`${LocalStorageKeys.USER_KEY}-${LocalStorageKeys.USER_INFO}`));
  }
}



