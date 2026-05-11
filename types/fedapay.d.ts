export {};

declare global {
  interface Window {
    FedaPay: {
      init: (config: { public_key: string; version: string }) => void;
      popup: (config: { transaction_id: string; callback: (result: any) => void; onClose: () => void }) => void;
    };
  }
}
