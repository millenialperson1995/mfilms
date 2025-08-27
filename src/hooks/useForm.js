import { useState } from 'react';

export const useForm = (initialState) => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro específico quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNestedChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      medidas: { ...prev.medidas, [name]: value }
    }));
    
    // Limpar erro de medidas quando o usuário começar a digitar
    if (errors.medidas) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.medidas;
        return newErrors;
      });
    }
  };

  const resetForm = () => {
    setForm(initialState);
    setErrors({});
  };

  return { form, setForm, errors, setErrors, handleChange, handleNestedChange, resetForm };
};