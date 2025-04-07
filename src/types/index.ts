export interface UserData {
  car_request: string;
  selected_services: Set<string>;
  last_selector_message_id: number | null;
  payment_method: string | null;
  language: string | null;
  manager: string | null;
  messagesToDelete: number[];
  keyboard_active: boolean;
  workflow_completed: boolean;
}

export interface ServiceOption {
  id: string;
  label: string;
  emoji: string;
}

export interface PaymentOption {
  id: string;
  label: string;
  emoji: string;
}

export interface LanguageOption {
  id: string;
  label: string;
  emoji: string;
  manager: string;
}
