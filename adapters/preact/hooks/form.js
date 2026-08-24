
export const useForm = ({ } = {}) => {
  const formData = {};
  const register = name => {
    return {
      onChange(e) {
        formData[name] = e.target.value;
      }
    };
  };
  const hanldeSubmit = (onSubmit) => {
    return e => onSubmit && onSubmit(formData, e);
  };
  return {
    register,
    hanldeSubmit,
  };
};
