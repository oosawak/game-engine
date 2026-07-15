# ゲームエンジンタスク

## 目的

設計書を、実装可能な TypeScript ゲームエンジンへ落とし込む。

## タスク方針

- 依存順に進める
- MVP は小さく保つ
- コアのライフサイクルが安定する前に描画やネットワークを増やさない
- タスクはテスト通過後に完了とする

## Phase 0: プロジェクト準備

- [ ] パッケージマネージャーと実行環境を確定する
- [ ] `src/` の初期ディレクトリ構成を作る
- [ ] `tsconfig.json` を追加する
- [ ] テストランナー設定を追加する
- [ ] まだ無ければ lint と format の設定を追加する

## Phase 1: 数学基盤

- [ ] `Vector3` を実装する
- [ ] `Vector2` を実装する
- [ ] `Quaternion` を実装する
- [ ] `Matrix4` を実装する
- [ ] 基本生成と演算の単体テストを追加する

## Phase 2: Component コア

- [x] `Component` を実装する
- [x] `start`、`update`、`render`、`destroy` のライフサイクル保護を実装する
- [x] `Component` の所有者を内部からのみ設定できるようにする
- [x] ライフサイクル状態遷移の単体テストを追加する

## Phase 3: Transform

- [x] 必須コンポーネントとして `Transform` を実装する
- [x] position、rotation、scale の状態を追加する
- [x] 移動と回転の補助メソッドを追加する
- [x] Transform 変化の単体テストを追加する

## Phase 4: GameObject

- [x] `GameObject` を実装する
- [x] 全 `GameObject` に `Transform` を付与する
- [x] Component の追加を実装する
- [x] 型指定で Component を取得する処理を実装する
- [x] `Transform` 保護付きの Component 削除を実装する
- [x] 子オブジェクト管理を実装する
- [x] 有効化と無効化を実装する
- [x] 破棄時の安全性を実装する
- [x] Component 追加とライフサイクル伝播のテストを追加する
- [x] 親子関係のテストを追加する

## Phase 5: Scene System

- [x] `Scene` を実装する
- [x] `SceneManager` を実装する
- [x] 複数シーンの登録を可能にする
- [x] シーン切り替えを可能にする
- [x] Scene の有効化と終了処理を実装する
- [x] アクティブなオブジェクトのみ update / render するようにする
- [x] シーン登録と切り替えのテストを追加する

## Phase 6: Timing と Engine Core

- [x] `Time` を実装する
- [x] `GameLoop` を実装する
- [x] `Engine` を実装する
- [x] `Engine` と `SceneManager` と `Time` を接続する
- [x] start / stop を実装する
- [x] Delta Time 計算を実装する
- [x] ループ制御と時間管理のテストを追加する

## Phase 7: Script Support

- [x] `ScriptComponent` を実装する
- [x] スクリプトのライフサイクル契約を定義する
- [x] サンプルのゲームプレイ用コンポーネントを追加する
- [x] ユーザー定義 Component 実行のテストを追加する

## Phase 8: 描画境界

- [x] `Renderer` インターフェースを定義する
- [x] `RenderContext` を定義する
- [x] `RendererComponent` を実装する
- [x] `CameraComponent` を実装する
- [x] `LightComponent` を実装する
- [x] Camera の視野、投影方式、ズーム、追従対象を定義する
- [x] Light の種類、強度、色、影響範囲を定義する
- [x] Scene の描画に Camera を必ず経由させる
- [x] Light を使う描画パスの入口を用意する
- [x] `Mesh`、`Material`、`Shader` のプレースホルダ型を追加する
- [x] 描画状態の収集をゲームロジックから分離する

## Phase 9: 入力とリソース

- [x] `InputManager` を実装する
- [x] `KeyboardInput` を実装する
- [x] `PointerInput` を実装する
- [x] `Resource` を実装する
- [x] `ResourceLoader` を実装する
- [x] `ResourceManager` を実装する

## Phase 10: WASM ブリッジ

- [ ] `WasmRuntime` を実装する
- [ ] `WasmMemory` を実装する
- [ ] バインディングの入口を定義する
- [ ] WASM がなくてもエンジンが動作するようにする

## Phase 11: アプリケーション層

- [x] `Game` を実装する
- [x] `MainScene` を実装する
- [x] 最小の起動処理を追加する
- [x] 動くオブジェクトを含むサンプルシーンを追加する
- [x] `Game View` 用の実行時ルートを定義する
- [x] エディタ表示と実行表示の責務を分ける
- [x] アプリケーションの起動処理から Scene を差し替えられるようにする

## Phase 12: 品質と検証

- [ ] コアライフサイクルのテストを追加する
- [ ] シーン切り替えのテストを追加する
- [ ] 破棄安全性のテストを追加する
- [ ] 親子更新のテストを追加する
- [x] 最小の Web 出力スパイクを早期に確認する
- [ ] ビルド確認を追加する
- [ ] 初回実行に必要な README の利用手順を追加する

## Phase 13: Editor UI 統一

- [ ] Inspector の共通レイアウト規約を実装に反映する
- [ ] `Position / Rotation / Scale` の表示形式を統一する
- [ ] 2D 用項目と 3D 用項目の見せ方を分ける
- [ ] `Scene View` と `Game View` のタブ切り替えを実装する
- [ ] `Game View` に実行中の状態を表示する
- [ ] PNG と ADVMNG の設定 UI を同じ部品で構成する
- [ ] 画面全体のスクロールをなくし、内部スクロールに限定する
- [ ] Scene View の高さと配置を FullHD 基準で調整する
- [ ] ADVMNG の子 PNG を親子関係として扱う UI を整備する
- [ ] UI 規約に反する新規追加を防ぐためのレビュー観点を追記する

## Phase 14: 出力と公開

- [x] アプリの出力先ディレクトリを定義する
- [x] `docs` を Web 公開用の出力先として扱う
- [x] HTML のビルドまたはコピー手順を定義する
- [x] 実行用アセットと公開用アセットを分離する
- [x] 生成物の一覧と公開手順を README に追記する
- [x] Web 出力を最小構成で確認し、HTML / JS / WASM / assets の結合を検証する

## Phase 15: VRM Pose Editor

- [x] VRM 用のポーズ編集は VRM Editor の中に統合する
- [x] VRM Editor の 3 ペイン構成を定義する
- [x] VRM Editor の左ペインにモーション一覧を表示する
- [x] VRM Editor の中央ペインにプレビューと再生制御を表示する
- [x] VRM Editor の右ペインに名前編集と詳細設定を表示する
- [x] 標準ポーズを `Idle / Wait` として定義する
- [x] `Reset Pose` を実装する
- [x] `Preset Pose` の選択を実装する
- [x] モーションの `id` と `alias` を登録できるようにする
- [x] スクリプトからは `id` で参照し、`alias` でも検索できるようにする
- [x] VRM Editor でモーション一覧と名前編集欄を表示する
- [x] 骨ごとの回転を JSON で保存・読込できるようにする
- [x] 表情や手指の調整を拡張項目として追加する
- [ ] `Scene View` で VRM の見た目を確認できるようにする
- [ ] VRM 本体とポーズデータを分離して管理する
- [x] モーション詳細は VRM Editor の右ペインで編集できるようにする

## Phase 16: Mint MCP Integration

- [ ] `MintMcpAdapter` を設計する
- [ ] `MintAssetProvider` の抽象を定義する
- [ ] 生成アセットの JSON マニフェスト形式を定義する
- [ ] Gaussian Splat の読み込み方針を定義する
- [ ] GLTF / GLB の読み込み方針を定義する
- [ ] Collider メタデータの受け取り方を定義する
- [ ] Streaming 情報の扱いを定義する
- [ ] 失敗時のフォールバックデータを定義する
- [ ] `docs` に Mint 由来アセット確認ページを追加する
- [ ] `mint-threejs-skills` の役割を README に明記する
- [ ] エンジンコアが Mint 非依存で動くことを確認する

## Phase 17: 共通アセットパイプライン

- [x] `AssetManifest` を実装する
- [x] `AssetEntry` に `id`、`kind`、`source`、`alias`、`scriptName` を持たせる
- [x] VRM モーションを共通マニフェストへ移行する
- [x] PNG、音声、シーンを同一形式で参照できるようにする
- [x] 外部ツールから出力した JSON をエンジン側で読めるようにする
- [x] `ResourceManager` と共通アセットを接続する
- [x] アセット検索の単体テストを追加する
- [x] 共通アセット形式の説明を `ja/DESIGN.md` に追加する
- [x] 共通アセットの利用方針を `ja/REQUIREMENTS.md` に追記する
- [x] `docs` に共通アセットのサンプル JSON を追加する

## Mint Integration MVP 定義

次を満たしたら Mint 統合の初期版完了とする。

- Mint MCP 由来のアセット定義を JSON で保持できる
- `id`、`scriptName`、`alias` を分けて扱える
- 生成アセットの取得失敗時にフォールバックへ切り替えられる
- Editor と Runtime が同じマニフェストを参照できる
- コアエンジンが Mint 非依存で動作する
- 三次元アセットの確認ページが `docs` に用意されている

## Shared Asset MVP 定義

次を満たしたら共通アセット基盤の初期版完了とする。

- `AssetManifest` を JSON から生成できる
- `id`、`kind`、`source`、`alias`、`scriptName` を持つ
- `alias` や `tag` でアセット検索できる
- VRM モーションや PNG を同じマニフェストで扱える
- 外部ツールの出力をそのまま読める
- `ResourceManager` と共存して使える

## Early Output Spike

次を満たしたら、出力の早期確認が完了とする。

- 最小の HTML / JavaScript / asset 配置で表示確認できる
- 将来の WASM 置き換えを妨げない
- 開発途中のシーンを 1 つだけ配布形式で再生できる
- Phase 14 本体実装に入る前に検証できる

## MVP 定義

次を満たしたら最初の MVP 完了とする。

- `Engine` の start / stop が動作する
- Delta Time が取得できる
- 複数シーンを登録・切り替えできる
- `GameObject` が Component と子を持てる
- `Transform` が必ず存在する
- `CameraComponent` と `LightComponent` の方針が明文化されている
- `Scene View` と `Game View` を区別できる
- アプリの出力先が定義されている
- `VRM Pose Editor` の方針が明文化されている
- VRM の標準ポーズが待機ポーズとして定義されている
- モーションの `id` と `alias` の運用方針が明文化されている
- VRM Editor の画面構成が明文化されている
- ライフサイクル順序が正しい
- 破棄済みオブジェクトが更新されない
- テストが通る
- UI の共通ルールが設計書と実装で一致している

## 推奨実装順

1. `Vector3`
2. `Component`
3. `Transform`
4. `GameObject`
5. `Scene`
6. `SceneManager`
7. `Time`
8. `Engine`
9. `ScriptComponent`
10. 描画境界
11. Editor UI 統一
12. 出力と公開
13. VRM Pose Editor
