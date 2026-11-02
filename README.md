# Rainbow

Repository dell'applicazione mobile Rainbow. Il progetto usa React Native e include configurazioni e codice nativo per Android e iOS. La struttura e i manifest descrivono flussi relativi a wallet e account, asset e transazioni, swap e operazioni di funding, NFT e WalletConnect.

## Requisiti verificati

- Node.js 22, indicato in `.node-version`.
- Yarn 4.13.0, fornito dal repository tramite `yarnPath` in `.yarnrc.yml`.
- Per lo sviluppo iOS: Ruby 3.4.8, indicato in `.ruby-version`, e Xcode 26.3, indicato in `.xcode-version`. Le dipendenze native iOS sono gestite con CocoaPods.

## Installazione

Dalla directory del repository, installa le dipendenze JavaScript e avvia la procedura di setup:

```sh
yarn install
yarn setup
```

Lo script `setup` esegue la generazione del codice GraphQL e l'aggiornamento dei dati di rete; inoltre richiama gli script per i file Google Services e il keystore di sviluppo, entrambi contrassegnati come opzionali nel manifest.

Per installare le dipendenze CocoaPods dopo il setup, esegui:

```sh
yarn install-pods
```

In alternativa, `yarn install-all` esegue `yarn install`, `yarn setup` e l'installazione delle dipendenze iOS.

## Avvio in sviluppo

Avvia Metro con:

```sh
yarn start
```

Per avviare l'applicazione sulle piattaforme native, usa i comandi definiti nel manifest:

```sh
yarn android
yarn ios
```

Lo script iOS seleziona il simulatore `iPhone 16 Pro`. Lo script Android usa React Native CLI e richiede un ambiente Android configurato localmente.

## Test e controlli

Esegui i test con Vitest:

```sh
yarn test
```

Per mantenere i test in modalità watch:

```sh
yarn test:watch
```

I controlli di lint e formattazione disponibili sono:

```sh
yarn lint
yarn lint:ci
```

## Struttura del repository

- `src/`: applicazione e moduli TypeScript/JavaScript.
- `android/` e `ios/`: progetti nativi delle due piattaforme.
- `scripts/`: script di setup e manutenzione.
- `e2e/`: contenuti relativi ai test end-to-end.
- `tools/`: strumenti di sviluppo, inclusi controlli sulle dipendenze.

Per le condizioni d'uso, consulta il file [`LICENSE`](LICENSE).
