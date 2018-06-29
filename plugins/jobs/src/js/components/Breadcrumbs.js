import { Link } from "react-router";
import PropTypes from "prop-types";
import React from "react";

import Breadcrumb from "#SRC/js/components/Breadcrumb";
import BreadcrumbTextContent from "#SRC/js/components/BreadcrumbTextContent";
import PageHeaderBreadcrumbs from "#SRC/js/components/PageHeaderBreadcrumbs";

/**
 * @param  {string} link
 * @param  {string[]} pathParts path including name (if given)
 * @param  {JSX.Element} [children=null] extra JSX Components to render
 *
 * @return {JSX.Element} Breadcrumb Part Component
 */
function BreadcrumbPart({ href, pathParts, children = null }) {
  return (
    <Breadcrumb key={pathParts.join(".")} title="Jobs">
      <BreadcrumbTextContent>
        <Link to={href}>{pathParts.slice(-1)}</Link>
      </BreadcrumbTextContent>
      {children}
    </Breadcrumb>
  );
}
BreadcrumbPart.propTypes = {
  href: PropTypes.string.isRequired,
  pathParts: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default function Breadcrumbs({ path, name, children, jobInfo }) {
  // we're starting from the back, so first we have children
  let breadcrumbs = React.Children.toArray(children);

  // if we got a name, thats a detail link
  if (name !== undefined) {
    breadcrumbs = [
      <BreadcrumbPart
        href={["/jobs/detail/"].concat(path, [name]).join(".")}
        pathParts={path.concat([name])}
      >
        {jobInfo}
      </BreadcrumbPart>
    ].concat(breadcrumbs);
  }

  // build up breadcrumb for path, starting from the end!
  if (path !== undefined) {
    for (let index = path.length; index > 0; index--) {
      breadcrumbs = [
        <BreadcrumbPart
          href={["/jobs/overview/"].concat(path.slice(0, index)).join(".")}
          pathParts={path.slice(0, index)}
        />
      ].concat(breadcrumbs);
    }
  }

  // add root element, here its named "Jobs"
  breadcrumbs = [
    <BreadcrumbPart href={"/jobs/overview/"} pathParts={["Jobs"]} />
  ].concat(breadcrumbs);

  return <PageHeaderBreadcrumbs iconID="jobs" breadcrumbs={breadcrumbs} />;
}

Breadcrumbs.propTypes = {
  jobInfo: PropTypes.node,
  name: PropTypes.string,
  path: PropTypes.arrayOf(PropTypes.string)
};
