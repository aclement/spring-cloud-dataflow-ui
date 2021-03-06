import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

import { SecurityInfo } from '../shared/model/about/security-info.model';
import { LoginRequest } from './model/login-request.model';
import { ErrorHandler } from '../shared/model/error-handler';
import { HttpUtils } from '../shared/support/http.utils';
import { Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { LoggerService } from '../shared/services/logger.service';

/**
 * The AuthService deals with all security-related services:
 *
 * - Login
 * - Logout
 * - Loading of security meta-information
 *
 * @author Gunnar Hillert
 */
@Injectable()
export class AuthService {

  public xAuthToken = '';

  private securityInfoUrl = '/security/info';
  private authenticationUrl = '/authenticate';
  private logoutUrl = '/dashboard/logout';

  private readonly xAuthTokenKeyName = 'xAuthToken';

  public securityInfo: SecurityInfo;
  public securityInfoSubject = new Subject<SecurityInfo>();

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandler,
    private loggerService: LoggerService) {
  }

  /**
   * Loading of security meta-information. E.g. used upon booting
   * up the application in order to determine whether security (login)
   * is needed.
   *
   * @param reconstituteSecurity Shall the logged-in security state
   * be restored from a potentially persisted 'xAuthToken'.
   */
  loadSecurityInfo(reconstituteSecurity = false): Observable<SecurityInfo> {
    this.loggerService.log(`Loading SecurityInfo - Reconstitute security? ${reconstituteSecurity}`);
    const httpHeaders = HttpUtils.getDefaultHttpHeaders();

    if (reconstituteSecurity) {
      const xAuthToken = this.retrievePersistedXAuthToken();
      if (xAuthToken) {
        this.xAuthToken = xAuthToken;
      }
    }

    return this.http.get<any>(this.securityInfoUrl, {
      headers: httpHeaders
    })
                    .map(body => {
                      this.securityInfo = new SecurityInfo().deserialize(body);
                      this.securityInfoSubject.next(this.securityInfo);
                      this.loggerService.log('SecurityInfo:', this.securityInfo);
                      if (!this.securityInfo.isAuthenticationEnabled
                        && this.xAuthToken) {
                        this.xAuthToken = undefined;
                        this.deletePersistedXAuthToken();
                      }
                      return this.securityInfo;
                    })
                    .catch(this.errorHandler.handleError);
  }

  /**
   * Logs in a user based on the provided {@link LoginRequest}. If the login
   * was successful, the retrieved xAuthToken will be persisted (Session
   * Storage) and the the xAuthToken will also be set in
   * {@link SecurityAwareRequestOptions}. Upon login a {@link SecurityInfo}
   * will be returned.
   *
   * @param loginRequest The login-request holding username and password
   */
  login(loginRequest: LoginRequest): Observable<SecurityInfo> {
    this.loggerService.log(`Logging in user ${loginRequest.username}.`);
    const httpHeaders = HttpUtils.getDefaultHttpHeaders();
    return this.http.post<any>(this.authenticationUrl, JSON.stringify(loginRequest), {headers: httpHeaders})
                    .map(response => {
                      return response as string;
                    })
                    .flatMap((id: string) => {
                      this.loggerService.log('Logging you in ...', httpHeaders);
                      this.xAuthToken = id;
                      this.persistXAuthToken(id);
                      return this.loadSecurityInfo();
                    })
                    .catch(this.errorHandler.handleError);
  }

  /**
   * Logs out the user. Upon logout a {@link SecurityInfo} will be
   * returned.
   */
  logout(): Observable<SecurityInfo> {
    this.loggerService.log('Logging out ...');
    const httpHeaders = HttpUtils.getDefaultHttpHeaders();
    return this.http.get(this.logoutUrl, { headers: httpHeaders})
                    .map(response => {
                      this.clearLocalSecurity();
                      return response;
                    })
                    .flatMap((response: Response) => {
                      this.loggerService.log('Retrieving security info ...', httpHeaders);
                      return this.loadSecurityInfo();
                    })
                    .catch(this.errorHandler.handleError);
  }

  /**
   * Clears all security-relevant information from the local application:
   *
   * - Calls `securityInfo.reset()`
   * - Deletes a persisted XAuthToken (Session Storage)
   *
   */
  public clearLocalSecurity() {
    this.securityInfo.reset();
    this.xAuthToken = null;
    this.deletePersistedXAuthToken();
  }

  private retrievePersistedXAuthToken(): string {
    const token = sessionStorage.getItem(this.xAuthTokenKeyName);
    if (token) {
      return JSON.parse(token);
    }
    return undefined;
  }

  private persistXAuthToken(token: string) {
    sessionStorage.setItem(this.xAuthTokenKeyName, JSON.stringify(token));
  }

  private deletePersistedXAuthToken() {
    sessionStorage.removeItem(this.xAuthTokenKeyName);
  }
}
