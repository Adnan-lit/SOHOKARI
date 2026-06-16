import client from './client';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'DISPUTED';

export type PaymentResponse = {
  paymentId:              string;
  bookingId:              string;
  customerId:             string;
  customerName?:          string;
  providerId:             string;
  providerName?:          string;
  amount:                 number;
  paymentMethod:          PaymentMethod;
  paymentStatus:          PaymentStatus;
  providerPaymentNumber?: string;
  serviceCategory?:       string;
  address?:               string;
  scheduledDate?:         string;
  confirmedAt?:           string;
  createdAt?:             string;
};

export type CreatePaymentPayload = {
  bookingId:     string;
  amount:        number;
  paymentMethod: PaymentMethod;
};

export const paymentsApi = {
  create: async (payload: CreatePaymentPayload): Promise<PaymentResponse> => {
    const { data: res } = await client.post<ApiResponse<PaymentResponse>>('/payments', payload);
    return res.data;
  },

  confirm: async (paymentId: string): Promise<PaymentResponse> => {
    const { data: res } = await client.put<ApiResponse<PaymentResponse>>(`/payments/${paymentId}/confirm`);
    return res.data;
  },

  getByBooking: async (bookingId: string): Promise<PaymentResponse | null> => {
    const { data: res } = await client.get<ApiResponse<PaymentResponse>>(`/payments/booking/${bookingId}`);
    return res.data;
  },

  getInvoice: async (paymentId: string): Promise<PaymentResponse> => {
    const { data: res } = await client.get<ApiResponse<PaymentResponse>>(`/payments/${paymentId}/invoice`);
    return res.data;
  },

  getMy: async (): Promise<PaymentResponse[]> => {
    const { data: res } = await client.get<ApiResponse<PaymentResponse[]>>('/payments/my');
    return res.data;
  },
};
