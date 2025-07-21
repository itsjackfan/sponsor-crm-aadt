'use client';

import React, { useState } from 'react';
import { Modal, Input, Select, Button } from '@/components/ui';
import { NewSponsorForm } from '@/types';

interface NewSponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewSponsorForm) => void;
}

const typeOptions = [
  { value: '', label: 'Select...' },
  { value: 'In-kind', label: 'In-kind' },
  { value: 'Corporate', label: 'Corporate' }
];

export const NewSponsorModal: React.FC<NewSponsorModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<NewSponsorForm>({
    name: '',
    type: 'In-kind',
    contents: '',
    approximateValue: ''
  });

  const [errors, setErrors] = useState<Partial<NewSponsorForm>>({});

  const handleChange = (field: keyof NewSponsorForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Partial<NewSponsorForm> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }
    
    if (!formData.contents.trim()) {
      newErrors.contents = 'Contents is required';
    }
    
    if (!formData.approximateValue.trim()) {
      newErrors.approximateValue = 'Approximate value is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
    setFormData({
      name: '',
      type: 'In-kind',
      contents: '',
      approximateValue: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      name: '',
      type: 'In-kind',
      contents: '',
      approximateValue: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="NEW SPONSOR"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field">
            <Input
              label="Org name"
              placeholder="Org name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as 'In-kind' | 'Corporate')}
                options={typeOptions.slice(1)}
                error={errors.type}
              />
            </div>
            <div className="form-field">
              <Input
                label="Contents"
                placeholder="Stuff"
                value={formData.contents}
                onChange={(e) => handleChange('contents', e.target.value)}
                error={errors.contents}
              />
            </div>
          </div>

          <div className="form-field">
            <Input
              label="Approximate value"
              placeholder="$MONEY"
              value={formData.approximateValue}
              onChange={(e) => handleChange('approximateValue', e.target.value)}
              error={errors.approximateValue}
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="submit-button"
        >
          Submit
        </Button>
      </form>

      <style jsx>{`
        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-field {
          /* Individual field styling handled by components */
        }

        .submit-button {
          display: block;
          margin: 32px auto 0;
          padding: 16px 40px;
        }
      `}</style>
    </Modal>
  );
};