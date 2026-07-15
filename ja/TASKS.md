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

- [ ] `Component` を実装する
- [ ] `start`、`update`、`render`、`destroy` のライフサイクル保護を実装する
- [ ] `Component` の所有者を内部からのみ設定できるようにする
- [ ] ライフサイクル状態遷移の単体テストを追加する

## Phase 3: Transform

- [ ] 必須コンポーネントとして `Transform` を実装する
- [ ] position、rotation、scale の状態を追加する
- [ ] 移動と回転の補助メソッドを追加する
- [ ] Transform 変化の単体テストを追加する

## Phase 4: GameObject

- [ ] `GameObject` を実装する
- [ ] 全 `GameObject` に `Transform` を付与する
- [ ] Component の追加を実装する
- [ ] 型指定で Component を取得する処理を実装する
- [ ] `Transform` 保護付きの Component 削除を実装する
- [ ] 子オブジェクト管理を実装する
- [ ] 有効化と無効化を実装する
- [ ] 破棄時の安全性を実装する
- [ ] Component 追加とライフサイクル伝播のテストを追加する
- [ ] 親子関係のテストを追加する

## Phase 5: Scene System

- [ ] `Scene` を実装する
- [ ] `SceneManager` を実装する
- [ ] 複数シーンの登録を可能にする
- [ ] シーン切り替えを可能にする
- [ ] Scene の有効化と終了処理を実装する
- [ ] アクティブなオブジェクトのみ update / render するようにする
- [ ] シーン登録と切り替えのテストを追加する

## Phase 6: Timing と Engine Core

- [ ] `Time` を実装する
- [ ] `GameLoop` を実装する
- [ ] `Engine` を実装する
- [ ] `Engine` と `SceneManager` と `Time` を接続する
- [ ] start / stop を実装する
- [ ] Delta Time 計算を実装する
- [ ] ループ制御と時間管理のテストを追加する

## Phase 7: Script Support

- [x] `ScriptComponent` を実装する
- [x] スクリプトのライフサイクル契約を定義する
- [ ] サンプルのゲームプレイ用コンポーネントを追加する
- [x] ユーザー定義 Component 実行のテストを追加する

## Phase 8: 描画境界

- [x] `Renderer` インターフェースを定義する
- [x] `RenderContext` を定義する
- [x] `RendererComponent` を実装する
- [ ] `CameraComponent` を実装する
- [ ] `LightComponent` を実装する
- [ ] Camera の視野、投影方式、ズーム、追従対象を定義する
- [ ] Light の種類、強度、色、影響範囲を定義する
- [ ] Scene の描画に Camera を必ず経由させる
- [ ] Light を使う描画パスの入口を用意する
- [ ] `Mesh`、`Material`、`Shader` のプレースホルダ型を追加する
- [ ] 描画状態の収集をゲームロジックから分離する

## Phase 9: 入力とリソース

- [ ] `InputManager` を実装する
- [ ] `KeyboardInput` を実装する
- [ ] `PointerInput` を実装する
- [ ] `Resource` を実装する
- [ ] `ResourceLoader` を実装する
- [ ] `ResourceManager` を実装する

## Phase 10: WASM ブリッジ

- [ ] `WasmRuntime` を実装する
- [ ] `WasmMemory` を実装する
- [ ] バインディングの入口を定義する
- [ ] WASM がなくてもエンジンが動作するようにする

## Phase 11: アプリケーション層

- [ ] `Game` を実装する
- [ ] `MainScene` を実装する
- [ ] 最小の起動処理を追加する
- [ ] 動くオブジェクトを含むサンプルシーンを追加する
- [ ] `Game View` 用の実行時ルートを定義する
- [ ] エディタ表示と実行表示の責務を分ける
- [ ] アプリケーションの起動処理から Scene を差し替えられるようにする

## Phase 12: 品質と検証

- [ ] コアライフサイクルのテストを追加する
- [ ] シーン切り替えのテストを追加する
- [ ] 破棄安全性のテストを追加する
- [ ] 親子更新のテストを追加する
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

- [ ] アプリの出力先ディレクトリを定義する
- [ ] `docs` を Web 公開用の出力先として扱う
- [ ] HTML のビルドまたはコピー手順を定義する
- [ ] 実行用アセットと公開用アセットを分離する
- [ ] 生成物の一覧と公開手順を README に追記する

## Phase 15: VRM Pose Editor

- [ ] VRM 用のポーズ編集画面を別画面として定義する
- [ ] 標準ポーズを `Idle / Wait` として定義する
- [ ] `Reset Pose` を実装する
- [ ] `Preset Pose` の選択を実装する
- [ ] 骨ごとの回転を JSON で保存・読込できるようにする
- [ ] 表情や手指の調整を拡張項目として追加する
- [ ] `Scene View` で VRM の見た目を確認できるようにする
- [ ] VRM 本体とポーズデータを分離して管理する

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
