"use client";

import Paragraph from "@components/Paragraph";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { usePortalElement } from "@hooks/usePortalElement";
import useFetchApi from "@utils/api";
import React, { Suspense } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { CloudAccess } from "@/interfaces/CloudAccess";
import PageContainer from "@/layouts/PageContainer";
import { CloudAccessProvider } from "@/modules/cloud-access/CloudAccessProvider";
import CloudAccessTable from "@/modules/cloud-access/table/CloudAccessTable";

export default function CloudAccessPage() {
  const { data: access, isLoading } =
    useFetchApi<CloudAccess[]>("/cloud-access");
  const { permission } = usePermissions();
  const { ref: headingRef, portalTarget } =
    usePortalElement<HTMLHeadingElement>();

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <h1 ref={headingRef}>Cloud Access</h1>
        <Paragraph>
          Connect cloud provider accounts so NetBird policy can authorize
          users to obtain short-lived, federated credentials without
          long-lived access keys. NetBird decides who may request access;
          each provider&apos;s own IAM decides what they can do with it.
        </Paragraph>
      </div>

      <RestrictedAccess hasAccess={permission.cloud_access.read}>
        <CloudAccessProvider>
          <Suspense fallback={<SkeletonTable />}>
            <CloudAccessTable
              data={access}
              isLoading={isLoading}
              headingTarget={portalTarget}
            />
          </Suspense>
        </CloudAccessProvider>
      </RestrictedAccess>
    </PageContainer>
  );
}
