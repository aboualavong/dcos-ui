#!/usr/bin/env groovy

@Library("sec_ci_libs@v2-latest") _

def master_branches = ["master", ] as String[]

pipeline {
  agent {
    dockerfile {
      args  "--shm-size=1g"
    }
  }

  environment {
    JENKINS_VERSION = "yes"
    NODE_PATH = "node_modules"
    INSTALLER_URL= "https://downloads.dcos.io/dcos/testing/master/dcos_generate_config.sh"
  }

  options {
    timeout(time: 2, unit: "HOURS")
    disableConcurrentBuilds()
  }

  stages {
    stage("Authorization") {
      steps {
        user_is_authorized(master_branches, "8b793652-f26a-422f-a9ba-0d1e47eb9d89", "#frontend-dev")
      }
    }

    stage("Build") {
      steps {
        sh "npm --unsafe-perm install"
        sh "npm run build"
        sh "tar czf release.tar.gz dist"
      }
    }

    stage("Test") {
      parallel {
        stage("Integration Test") {
          steps {
            sh "npm run integration-tests"
          }

          post {
            always {
              archiveArtifacts "cypress/**/*"
              junit "cypress/results.xml"
            }
          }
        }
        stage("System Test") {
          steps {
            withCredentials([
                [
                  $class: "AmazonWebServicesCredentialsBinding",
                  credentialsId: "f40eebe0-f9aa-4336-b460-b2c4d7876fde",
                  accessKeyVariable: "AWS_ACCESS_KEY_ID",
                  secretKeyVariable: "AWS_SECRET_ACCESS_KEY"
                ]
              ]) {
              sh "dcos-system-test-driver -j1 -v ./system-tests/driver-config/jenkins.sh"
            }
          }

          post {
            always {
              archiveArtifacts "results/**/*"
              junit "results/results.xml"
            }
          }
        }
      }
    }

    // Upload the current master as "latest" to s3
    // and update the corresponding DC/OS branch:
    // For Example:
    // - dcos-ui/master/dcos-ui-latest
    // - dcos-ui/1.12/dcos-ui-latest
    stage("Release Latest") {
      when {
        expression {
          master_branches.contains(BRANCH_NAME)
        }
      }

      steps {
        withCredentials([
            string(credentialsId: "3f0dbb48-de33-431f-b91c-2366d2f0e1cf",variable: "AWS_ACCESS_KEY_ID"),
            string(credentialsId: "f585ec9a-3c38-4f67-8bdb-79e5d4761937",variable: "AWS_SECRET_ACCESS_KEY"),
            usernamePassword(credentialsId: "a7ac7f84-64ea-4483-8e66-bb204484e58f", passwordVariable: "GIT_PASSWORD", usernameVariable: "GIT_USER")
        ]) {
          sh "git config --global user.email $GIT_USER@users.noreply.github.com"
          sh "git config --global user.name 'MesosphereCI Robot'"
          sh "git config credential.helper 'cache --timeout=300'"

          sh "./scripts/ci/release-latest"
        }
      }

      post {
        always {
          archiveArtifacts "buildinfo.json"
        }
      }
    }

    stage("Run Enterprise Pipeline") {
      when {
        expression {
          master_branches.contains(BRANCH_NAME)
        }
      }
      steps {
        build job: "frontend/dcos-ui-ee-pipeline/" + env.BRANCH_NAME.replaceAll("/", "%2F"), wait: false
      }
    }
  }

  post {
    failure {
      withCredentials([
        string(credentialsId: "8b793652-f26a-422f-a9ba-0d1e47eb9d89", variable: "SLACK_TOKEN")
      ]) {
        slackSend (
          channel: "#frontend-ci-status",
          color: "danger",
          message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.RUN_DISPLAY_URL})",
          teamDomain: "mesosphere",
          token: "${env.SLACK_TOKEN}",
        )
      }
    }
    unstable {
      withCredentials([
        string(credentialsId: "8b793652-f26a-422f-a9ba-0d1e47eb9d89", variable: "SLACK_TOKEN")
      ]) {
        slackSend (
          channel: "#frontend-ci-status",
          color: "warning",
          message: "UNSTABLE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.RUN_DISPLAY_URL})",
          teamDomain: "mesosphere",
          token: "${env.SLACK_TOKEN}",
        )
      }
    }
  }
}
