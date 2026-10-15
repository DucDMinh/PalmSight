import * as yup from 'yup';
import {
  ReadingSchool,
  HandOrientation,
  ImageQuality,
} from '../enums';
import { REFERRAL_CODE_REGEX, USERNAME_REGEX } from '../constants';

export const registerSchema = yup.object({
  displayName: yup
    .string()
    .trim()
    .required('Tên hiển thị không được để trống')
    .min(1, 'Tên hiển thị phải có ít nhất 1 ký tự')
    .max(50, 'Tên hiển thị tối đa 50 ký tự'),
  username: yup
    .string()
    .trim()
    .lowercase()
    .required('Username không được để trống')
    .matches(
      USERNAME_REGEX,
      'Username chỉ gồm chữ thường, số, dấu gạch dưới, từ 3-20 ký tự',
    ),
  email: yup
    .string()
    .trim()
    .lowercase()
    .required('Email không được để trống')
    .email('Email không đúng định dạng')
    .max(254, 'Email tối đa 254 ký tự'),
  password: yup
    .string()
    .required('Mật khẩu không được để trống')
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(128, 'Mật khẩu tối đa 128 ký tự')
    .test(
      'not-equal-username-or-email',
      'Mật khẩu không được trùng với username hoặc email',
      function (value) {
        if (!value) return true;
        const { username, email } = this.parent as { username?: string; email?: string };
        const lowerVal = value.toLowerCase();
        if (username && lowerVal === String(username).toLowerCase()) return false;
        if (email && lowerVal === String(email).toLowerCase()) return false;
        return true;
      },
    ),
  referralCode: yup
    .string()
    .trim()
    .transform((val) => (val === '' ? undefined : val?.toUpperCase()))
    .matches(REFERRAL_CODE_REGEX, {
      message: 'Mã giới thiệu phải gồm 8 ký tự hợp lệ',
      excludeEmptyString: true,
    })
    .optional(),
});

export const registerFormSchema = registerSchema.shape({
  confirmPassword: yup
    .string()
    .required('Vui lòng xác nhận lại mật khẩu')
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp'),
});

export const loginSchema = yup.object({
  login: yup
    .string()
    .trim()
    .lowercase()
    .required('Email hoặc username không được để trống'),
  password: yup
    .string()
    .required('Mật khẩu không được để trống')
    .min(1, 'Mật khẩu không được để trống')
    .max(128, 'Mật khẩu tối đa 128 ký tự'),
});

export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .trim()
    .lowercase()
    .required('Email không được để trống')
    .email('Email không đúng định dạng')
    .max(254, 'Email tối đa 254 ký tự'),
});

export const resetPasswordSchema = yup.object({
  token: yup
    .string()
    .trim()
    .required('Mã xác thực không được để trống'),
  newPassword: yup
    .string()
    .required('Mật khẩu mới không được để trống')
    .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .max(128, 'Mật khẩu tối đa 128 ký tự'),
});

export const resetPasswordFormSchema = resetPasswordSchema.shape({
  confirmPassword: yup
    .string()
    .required('Vui lòng xác nhận lại mật khẩu')
    .oneOf([yup.ref('newPassword')], 'Mật khẩu xác nhận không khớp'),
});

export const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Mật khẩu hiện tại không được để trống'),
  newPassword: yup
    .string()
    .required('Mật khẩu mới không được để trống')
    .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .max(128, 'Mật khẩu tối đa 128 ký tự')
    .notOneOf([yup.ref('currentPassword')], 'Mật khẩu mới không được trùng với mật khẩu hiện tại'),
});

export const enterReferralSchema = yup.object({
  code: yup
    .string()
    .trim()
    .transform((val) => val?.toUpperCase())
    .required('Mã giới thiệu không được để trống')
    .matches(REFERRAL_CODE_REGEX, 'Mã giới thiệu phải gồm 8 ký tự hợp lệ'),
});

export const readingSectionResultSchema = yup.object({
  key: yup.string().required('Key mục bói không được để trống'),
  title: yup.string().max(60, 'Tiêu đề tối đa 60 ký tự').required('Tiêu đề không được để trống'),
  observation: yup.string().max(800, 'Quan sát tối đa 800 ký tự').required('Quan sát không được để trống'),
  meaning: yup.string().max(800, 'Ý nghĩa tối đa 800 ký tự').required('Ý nghĩa không được để trống'),
});

export const palmResultSchema = yup.object({
  isPalm: yup.boolean().required('isPalm là bắt buộc'),
  rejectReason: yup
    .string()
    .nullable()
    .max(800, 'Lý do từ chối tối đa 800 ký tự')
    .default(null),
  school: yup
    .mixed<ReadingSchool>()
    .oneOf(Object.values(ReadingSchool))
    .when('isPalm', {
      is: true,
      then: (schema) => schema.required('Trường phái là bắt buộc khi ảnh là lòng bàn tay'),
      otherwise: (schema) => schema.nullable().optional(),
    }),
  hand: yup
    .mixed<HandOrientation>()
    .oneOf(Object.values(HandOrientation))
    .when('isPalm', {
      is: true,
      then: (schema) => schema.required('Tay xem là bắt buộc khi ảnh là lòng bàn tay'),
      otherwise: (schema) => schema.nullable().optional(),
    }),
  imageQuality: yup
    .mixed<ImageQuality>()
    .oneOf(Object.values(ImageQuality))
    .when('isPalm', {
      is: true,
      then: (schema) => schema.required('Chất lượng ảnh là bắt buộc khi ảnh là lòng bàn tay'),
      otherwise: (schema) => schema.nullable().optional(),
    }),
  topics: yup
    .array()
    .of(yup.string().required())
    .when('isPalm', {
      is: true,
      then: (schema) => schema.required('Danh sách mục bói là bắt buộc'),
      otherwise: (schema) => schema.nullable().optional(),
    }),
  sections: yup
    .array()
    .of(readingSectionResultSchema)
    .when('isPalm', {
      is: true,
      then: (schema) => schema.required('Mục bói riêng là bắt buộc'),
      otherwise: (schema) => schema.nullable().optional(),
    }),
  aspects: yup
    .object()
    .when('isPalm', {
      is: true,
      then: (schema) =>
        schema
          .required('Khía cạnh cuộc sống là bắt buộc')
          .test(
            'aspects-values',
            'Nội dung khía cạnh cuộc sống phải là chuỗi tối đa 800 ký tự',
            (val) => {
              if (!val) return true;
              return Object.values(val).every(
                (v) => typeof v === 'string' && v.length <= 800,
              );
            },
          ),
      otherwise: (schema) => schema.nullable().optional(),
    }),
  summary: yup
    .string()
    .max(300, 'Tóm tắt tối đa 300 ký tự')
    .when('isPalm', {
      is: true,
      then: (schema) => schema.required('Tóm tắt là bắt buộc khi ảnh là lòng bàn tay'),
      otherwise: (schema) => schema.nullable().optional(),
    }),
  advice: yup
    .string()
    .max(800, 'Lời khuyên tối đa 800 ký tự')
    .when('isPalm', {
      is: true,
      then: (schema) => schema.required('Lời khuyên là bắt buộc khi ảnh là lòng bàn tay'),
      otherwise: (schema) => schema.nullable().optional(),
    }),
  disclaimer: yup
    .string()
    .max(800, 'Câu miễn trừ tối đa 800 ký tự')
    .when('isPalm', {
      is: true,
      then: (schema) => schema.required('Câu miễn trừ là bắt buộc khi ảnh là lòng bàn tay'),
      otherwise: (schema) => schema.nullable().optional(),
    }),
});
