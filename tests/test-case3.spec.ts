import { test } from "../fixtures/base";
import { LoginCredentials } from "../data";


test('login for demouser is successful', async ({ loginPage }) => {
    const loginCredentials: LoginCredentials = {
            username: 'demouser',
            password: 'fashion123',
    };
    await loginPage.login(loginCredentials.username, loginCredentials.password);
});