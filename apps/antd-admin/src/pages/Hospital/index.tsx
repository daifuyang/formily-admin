import React from 'react';
import Form from '@/components/Form';
import { hospitalSchema } from './schema';

const HospitalManagement: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <h1>医院管理</h1>
      <Form schema={hospitalSchema} />
    </div>
  );
};

export default HospitalManagement;
