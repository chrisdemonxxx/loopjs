import React from 'react';

const AgentSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-8 text-center">
        <div className="text-5xl mb-4">🧬</div>
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
          Advanced Agent Builder
        </h1>
        <p className="text-bodydark2 max-w-2xl mx-auto">
          The next-generation polymorphic agent builder is currently under construction.
          We are polishing the workflow for MSI packaging, evasion techniques, and
          stealth capabilities. In the meantime, you can continue to use the command
          interface and terminal to interact with connected agents.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            emoji: '🛡️',
            title: 'Evasion Engine',
            description:
              'Automatic process hollowing, memory evasion, and smart sandbox detection tuned per build.'
          },
          {
            emoji: '🔐',
            title: 'Secure Packaging',
            description:
              'Password-protected archives and authenticated downloads for streamlined operator hand-offs.'
          },
          {
            emoji: '🧠',
            title: 'AI Templates',
            description:
              'Curated templates that adapt commands to the target operating system and privilege level.'
          }
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white dark:bg-boxdark rounded-lg border border-dashed border-stroke/60 dark:border-strokedark/60 p-6 text-left"
          >
            <div className="text-3xl mb-3">{item.emoji}</div>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-2">
              {item.title}
            </h2>
            <p className="text-sm text-bodydark2">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentSection;
