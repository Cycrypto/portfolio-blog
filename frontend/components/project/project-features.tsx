'use client';

import { CheckCircle } from 'lucide-react';

import { Panel } from '@/components/ui/panel';

interface Feature {
  title: string;
  description: string;
}

interface ProjectFeaturesProps {
  features: Feature[];
}

export function ProjectFeatures({ features }: ProjectFeaturesProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-neutral-slate-800">
        주요 기능
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Panel
            key={index}
            variant="glass"
            className="relative overflow-hidden p-6"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
            <div className="relative flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-neutral-slate-800">
                  {feature.title}
                </h3>
                <p className="text-neutral-slate-600">{feature.description}</p>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
