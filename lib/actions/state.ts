export type FormActionState = {
  message: string | null;
  errors?: Record<string, string[] | undefined>;
};

export const initialFormActionState: FormActionState = {
  message: null,
};
