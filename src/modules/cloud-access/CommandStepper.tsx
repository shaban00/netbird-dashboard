import Button from "@components/Button";
import { Callout } from "@components/Callout";
import HelpText from "@components/HelpText";
import { Label } from "@components/Label";
import { ModalClose, ModalFooter } from "@components/modal/Modal";
import { ArrowLeftIcon, ArrowRightIcon, ShieldCheckIcon } from "lucide-react";
import React, { useState } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { CloudDeployStep } from "@/interfaces/CloudAccess";
import CommandsBlock from "@/modules/cloud-access/CommandsBlock";

type Props = {
  steps: CloudDeployStep[];
  onValidate: () => void;
  validateDisabled?: boolean;
  children?: React.ReactNode;
};

export default function CommandStepper({
  steps,
  onValidate,
  validateDisabled = false,
  children,
}: Readonly<Props>) {
  const { permission } = usePermissions();
  const [currentStep, setCurrentStep] = useState(0);

  if (steps.length === 0) return null;

  const step = steps[Math.min(currentStep, steps.length - 1)];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <>
      <div className={"px-8 py-6 flex flex-col gap-3 min-w-0 overflow-x-hidden"}>
        {steps.length > 1 && (
          <HelpText margin={false} className={"text-xs uppercase tracking-wide"}>
            Step {currentStep + 1} of {steps.length}
          </HelpText>
        )}
        <div>
          <Label>{step.title}</Label>
          <HelpText>{step.description}</HelpText>
        </div>
        <CommandsBlock commands={step.command} />

        {isLast && children}

        {isLast && (
          <Callout variant={"info"}>
            Changes can take a few minutes to apply — if validate fails, wait and try again.
          </Callout>
        )}
      </div>

      <ModalFooter className={"items-center"}>
        <div className={"flex items-center justify-between w-full"}>
          <div>
            {!isFirst && (
              <Button
                variant={"secondary"}
                onClick={() => setCurrentStep((s) => s - 1)}
              >
                <ArrowLeftIcon size={16} />
                Back
              </Button>
            )}
          </div>

          <div className={"flex gap-3"}>
            <ModalClose asChild={true}>
              <Button variant={"secondary"}>Close</Button>
            </ModalClose>

            {isLast ? (
              <Button
                variant={"primary"}
                onClick={onValidate}
                disabled={!permission.cloud_access.update || validateDisabled}
              >
                <ShieldCheckIcon size={16} />
                Validate
              </Button>
            ) : (
              <Button
                variant={"primary"}
                onClick={() => setCurrentStep((s) => s + 1)}
              >
                Continue
                <ArrowRightIcon size={16} />
              </Button>
            )}
          </div>
        </div>
      </ModalFooter>
    </>
  );
}
