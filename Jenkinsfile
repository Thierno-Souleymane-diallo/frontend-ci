pipeline {
    agent any

    environment {
        IMAGE_NAME = 'thiernosouleymanediallo/sunusante-frontend'
        IMAGE_TAG  = "${BUILD_NUMBER}"
    }

    triggers {
        pollSCM('H/2 * * * *')
    }

    stages {
        stage('Installer et compiler') {
            steps {
                sh 'docker build --target build -t sunusante-frontend-atelier .'
            }
        }
        stage('Construire l image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
            }
        }
        stage('Publier sur Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials',
                                                  usernameVariable: 'DOCKER_USER',
                                                  passwordVariable: 'DOCKER_TOKEN')]) {
                    sh 'echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USER" --password-stdin'
                    sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                    sh "docker push ${IMAGE_NAME}:latest"
                }
            }
        }
        stage('Declencher le deploiement') {
            steps {
                build job: 'sunusante-cd', wait: false,
                      parameters: [string(name: 'FRONTEND_TAG', value: "${IMAGE_TAG}")]
            }
        }
    }

    post {
        always {
            sh 'docker logout'
        }
        success {
            echo "Image ${IMAGE_NAME}:${IMAGE_TAG} publiee sur Docker Hub"
        }
        failure {
            echo 'Echec du pipeline CI frontend'
        }
    }
}