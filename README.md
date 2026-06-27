# OFDM Principle Simulator (OFDM原理シミュレーター)

ブラウザ上で直交周波数分割多重方式 (OFDM: Orthogonal Frequency Division Multiplexing) の原理を直感的に学べるインタラクティブな教育用シミュレーターです。

🌐 **[シミュレーターを開く (GitHub Pages) ↗](https://agtkh.github.io/ofdm-lecture/)**

## 概要

Wi-Fi や 4G/5G などの最新無線通信において欠かすことのできないコア技術である「OFDM」。
数式だけで理解するのが難しいこの技術を、ユーザー自身がパラメータ（周波数、振幅、位相、QAMレベルなど）を動かしながら視覚的に体験できる Web アプリケーションです。

## 主な学習コンテンツ

1. **直交する周波数とは？**
   - 異なる周波数の波を掛け合わせて積分すると「面積がゼロ」になる様子を可視化。
2. **なぜ受信機で波を分解できるのか？**
   - 混ざり合った波の中から、特定の周波数の波だけを抽出する仕組みを体験。
3. **デジタルデータの重畳 (QPSK / QAM)**
   - I成分(cos)とQ成分(sin)を用いた位相制御と、一度に複数のビットを送る仕組み。
4. **ガードインターバル (GI) の役割**
   - シンボル間の不連続性と、遅延波（マルチパス）から直交性を守る仕組み。
5. **同期ズレによるエラーとコンスタレーション**
   - 受信機の位相がズレた際のコンスタレーション上の変化と、エラー判定をシミュレート。
6. **スライディング相関とプリアンブル**
   - 通信開始時に、ノイズの中からナノ秒単位の波のスタート位置を見つけ出す「待ち受け処理」の体験。

## 技術スタック

- **React** (UIライブラリ)
- **TypeScript** (静的型付け)
- **Vite** (ビルドツール)
- **Tailwind CSS** (スタイリング)
- **MathJax** (数式レンダリング)
- **GitHub Actions / GitHub Pages** (CI/CD・ホスティング)

## ローカルでの実行方法

Node.js がインストールされている環境で、以下のコマンドを実行してください。

```bash
# リポジトリのクローン
git clone https://github.com/agtkh/ofdm-lecture.git
cd ofdm-lecture

# 依存関係のインストール
npm install

# 開発用サーバーの起動
npm run dev
```

起動後、ブラウザで `http://localhost:5173/ofdm-lecture/` (ポート番号はコンソールに表示されたもの) にアクセスしてください。

## ライセンス

This project is open source and available under the [MIT License](LICENSE).
