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

- [ ] `ScriptComponent` を実装する
- [ ] スクリプトのライフサイクル契約を定義する
- [ ] サンプルのゲームプレイ用コンポーネントを追加する
- [ ] ユーザー定義 Component 実行のテストを追加する

## Phase 8: 描画境界

- [ ] `Renderer` インターフェースを定義する
- [ ] `RenderContext` を定義する
- [ ] `RendererComponent` を実装する
- [ ] `CameraComponent` を実装する
- [ ] `LightComponent` を実装する
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

## Phase 12: 品質と検証

- [ ] コアライフサイクルのテストを追加する
- [ ] シーン切り替えのテストを追加する
- [ ] 破棄安全性のテストを追加する
- [ ] 親子更新のテストを追加する
- [ ] ビルド確認を追加する
- [ ] 初回実行に必要な README の利用手順を追加する

## MVP 定義

次を満たしたら最初の MVP 完了とする。

- `Engine` の start / stop が動作する
- Delta Time が取得できる
- 複数シーンを登録・切り替えできる
- `GameObject` が Component と子を持てる
- `Transform` が必ず存在する
- ライフサイクル順序が正しい
- 破棄済みオブジェクトが更新されない
- テストが通る

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

