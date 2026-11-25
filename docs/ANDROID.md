# App Android — testar e publicar na Play Store

## Ferramentas (já instaladas nesta máquina)

- Android Studio: `D:\Android\android-studio`
- Java 21 (o Gradle do projeto não roda no Java 25 que vem com o Android Studio): `D:\Android\jdk-21`
- SDK: pasta padrão do Android Studio (`%LOCALAPPDATA%\Android\Sdk`), apontada em `android/local.properties`

## Gerar o app

```powershell
npm run icons                 # só se o desenho do ícone mudar (scripts/icons.mjs)
npm run build:mobile          # site → app (dist/mobile)
npx cap sync android          # copia para o projeto Android
$env:JAVA_HOME="D:\Android\jdk-21"
cd android
.\gradlew.bat assembleDebug   # APK de teste: android/app/build/outputs/apk/debug/app-debug.apk
.\gradlew.bat bundleRelease   # AAB da Play Store: android/app/build/outputs/bundle/release/app-release.aab
```

O APK de teste pode ser enviado por WhatsApp/Drive e instalado em qualquer Android
(é preciso permitir "instalar apps de fontes desconhecidas").

## Chave de assinatura (uma vez só — faça você mesmo)

A Play Store só aceita o AAB assinado com a **sua chave de envio**. Ela é a identidade do app na loja:
**guarde o arquivo e a senha em lugar seguro** (gerenciador de senhas + cópia fora do computador).

1. Crie a chave (vai pedir uma senha e alguns dados; escolha a senha você):

   ```powershell
   & "D:\Android\jdk-21\bin\keytool.exe" -genkeypair -v -keystore D:\Android\chaves\biblioteca-viva-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Crie `android/keystore.properties` (já está no `.gitignore`, nunca vai para o GitHub):

   ```properties
   storeFile=D:/Android/chaves/biblioteca-viva-upload.jks
   storePassword=SUA_SENHA
   keyAlias=upload
   keyPassword=SUA_SENHA
   ```

3. Rode `.\gradlew.bat bundleRelease` — o AAB sai assinado.

## Publicar para teste (Play Console)

1. Conta de desenvolvedor no [Play Console](https://play.google.com/console) (taxa única de US$ 25).
2. Criar app → nome "Biblioteca Viva", idioma pt-BR, app gratuito.
3. **Testes → Teste interno** → criar versão → enviar o `app-release.aab` → adicionar e-mails dos testadores.
4. Preencher o mínimo pedido: política de privacidade (`https://<seu-site>/privacidade`),
   classificação de conteúdo, público-alvo, "segurança dos dados" (localização aproximada usada só no aparelho;
   e-mail e nome da conta no Supabase).
5. A cada nova versão: aumentar `versionCode` (e `versionName`) em `android/app/build.gradle`.
