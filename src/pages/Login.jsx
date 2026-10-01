import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="logo logo-big">LUCK<span>.IO</span></div>
        <h2>Iniciar sesión</h2>

        <label className="field">
          <span>Correo</span>
          <input type="email" name="email" value={form.email} onChange={onChange} required />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input type="password" name="password" value={form.password} onChange={onChange} required />
        </label>

        {error && <div className="alert alert-error">{error}</div>}

        <button className="btn btn-gold btn-block" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="muted center">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </form>
    </div>
  );
}